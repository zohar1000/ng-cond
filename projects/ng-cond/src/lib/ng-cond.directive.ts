import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Inject,
  Input,
  NgZone,
  OnDestroy, Optional,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { NgCondContext } from './models/ng-cond-context.model';
import { Cond } from './models/cond.model';
import { Exp } from './models/exp.model';
import { CondOpts } from './models/cond-opts.model';
import { NG_COND_OPTS_TOKEN } from './tokens/ng-cond-opts.token';

@Directive({ selector: '[ngCond]' })
export class NgCondDirective implements OnDestroy {
  private readonly KEYWORD = 'NgCond';
  private readonly SINGLE_KEY = '@singleCond';
  private readonly OPTS_KEYS = ['isShowOnValue', 'isShowOnEmit', 'isThrowOnError', 'isMarkForCheck', 'isDetectChanges', 'isClearValueOnError'];
  private isShow = false;
  private isMulti = false;
  private conds: Cond[];
  private opts: CondOpts = {};
  private isUpdateViewPending = false;
  private context: NgCondContext = new NgCondContext();
  private elseTemplateRef: TemplateRef<NgCondContext> | null = null;
  private thenViewRef: EmbeddedViewRef<NgCondContext> | null = null;
  private elseViewRef: EmbeddedViewRef<NgCondContext> | null = null;
  private error;
  private complete;
  private exp;

  constructor(
      @Optional() @Inject(NG_COND_OPTS_TOKEN) opts: CondOpts,
      private viewContainer: ViewContainerRef,
      private thenTemplateRef: TemplateRef<NgCondContext<any>>,
      private cdr: ChangeDetectorRef,
      ngZone: NgZone) {
console.log(this.constructor.name, 'opts:', opts);
    const isZone = ngZone instanceof NgZone;
    this.opts.isMarkForCheck = isZone;
    this.opts.isDetectChanges = !isZone;
    if (opts) this.OPTS_KEYS.forEach(key => { if (opts.hasOwnProperty(key)) this.opts[key] = Boolean(opts[key]); });
  }

  /***********************/
  /*      I N P U T      */
  /***********************/

  @Input() set ngCond(exp) {
    this.exp = exp;
    setTimeout(() => {
      const exps: Exp[] = this.getParsedExp(exp);
      if (!this.conds) this.initConds(exps);
      this.setConds(exps);
      setTimeout(this.updateViewOnInput.bind(this));
    });
  }

  @Input()
  set ngCondMulti(isMulti: boolean) {
    this.isMulti = isMulti;
  }

  @Input()
  set ngCondThen(templateRef: TemplateRef<NgCondContext> | null) {
    this.assertTemplate(`ng${this.KEYWORD}Then`, templateRef);
    this.thenTemplateRef = templateRef;
    this.thenViewRef = null;  // clear previous view if any.
    setTimeout(this.updateViewOnInput.bind(this));
  }

  @Input()
  set ngCondElse(templateRef: TemplateRef<NgCondContext> | null) {
    this.assertTemplate(`ng${this.KEYWORD}Else`, templateRef);
    this.elseTemplateRef = templateRef;
    this.elseViewRef = null;  // clear previous view if any.
    setTimeout(this.updateViewOnInput.bind(this));
  }

  @Input()
  set ngCondOpts(opts) {
    if (!opts || typeof opts !== 'object' || Object.keys(opts).length === 0) return;
    this.OPTS_KEYS.forEach(key => this.opts[key] = Boolean(opts[key]));
   }


  /***********************/
  /*      I T E M S      */
  /***********************/

  getParsedExp(exp) {
    const isSingle = exp instanceof Observable || exp instanceof Promise || typeof exp !== 'object' || !this.isMulti;
    this.isMulti = !isSingle;
    if (!this.isMulti) {
      return [{ key: this.SINGLE_KEY, cond: exp }];
    } else {
      const exps = Object.keys(exp).map(key => ({ key, cond: exp[key] }));
      if (exps.length === 0) {
        throw new Error(`An empty object was passed to ${this.KEYWORD}.`);
      }
      return exps;
    }
  }

  initConds(exps: Exp[]) {
    const len = exps.length;
    this.conds = new Array(len);
    for (let i = 0; i < len; i++) {
      this.conds[i] = { value: undefined, key: exps[i].key };
    }
  }

  setConds(exps: Exp[]) {
    for (let i = 0, len = exps.length; i < len; i++) {
      this.setDirectCond(exps[i].cond, i);
    }
  }

  protected setDirectCond(cond, i) {
    if (cond instanceof Observable) {
      this.setItemObservable(cond, i);
    } else if (cond instanceof Promise) {
      this.setItemPromise(cond, i);
    } else {
      if (this.conds[i].subscription) this.clearItem(this.conds[i], true);
      this.conds[i].value = cond;
    }
  }

  private setItemObservable(obs, i) {
    if (this.conds[i].obs && this.conds[i].obs !== obs) this.clearItem(this.conds[i], true);
    if (!this.conds[i].obs) {
      this.conds[i].obs = obs;
      this.conds[i].subscription = obs
        .pipe(distinctUntilChanged())
        .subscribe(
            value => this.onNext(this.conds[i], value),
            e => this.onError(this.conds[i], e),
            () => this.onComplete(this.conds[i])
        );
    }
  }

  private setItemPromise(promise, i) {
    if (this.conds[i].promise && this.conds[i].promise !== promise) this.clearItem(this.conds[i], true);
    if (!this.conds[i].promise) {
      this.conds[i].promise = promise;
      this.conds[i].subscription = promise.then(value => {
        this.onNext(this.conds[i], value);
        this.onComplete(this.conds[i]);
      }, e => this.onError(this.conds[i], e));
    }
  }


  private onNext(cond: Cond, value) {
    cond.value = value;
    if (this.error) delete this.error[cond.key];
    if (this.complete) delete this.complete[cond.key];
    this.updateView();
  }

  onError(cond: Cond, e) {
    if (!this.error) this.error = {};
    this.error[cond.key] = e;
    if (this.opts.isClearValueOnError) cond.value = undefined;
    this.updateView();
    if (this.opts.isThrowOnError) {
      throw e;
    }
  }

  onComplete(cond: Cond) {
    if (!this.complete) this.complete = {};
    this.complete[cond.key] = true;
    this.updateView();
  }


  /*****************************/
  /*      D I S P L A Y        */
  /*****************************/

  private updateViewOnInput() {
    if (this.isUpdateViewPending) return;
    this.isUpdateViewPending = true;
    setTimeout(() => {
      this.isUpdateViewPending = false;
      this.updateView();
    });
  }

  private updateView() {
    this.isShow = this.conds.every(cond =>
      this.opts.isShowOnValue && cond.value !== undefined ||
      this.opts.isShowOnEmit && (cond.value !== undefined && cond.value !== null) ||
      Boolean(cond.value)
    );

    this.setValue();
    if (this.isShow) {
      if (!this.thenViewRef) {
        this.viewContainer.clear();
        this.elseViewRef = null;
        if (this.thenTemplateRef) {
          this.thenViewRef =
            this.viewContainer.createEmbeddedView(this.thenTemplateRef, this.context);
        }
      }
    } else {
      if (!this.elseViewRef) {
        this.viewContainer.clear();
        this.thenViewRef = null;
        if (this.elseTemplateRef) {
          this.elseViewRef =
            this.viewContainer.createEmbeddedView(this.elseTemplateRef, this.context);
        }
      }
    }

    if (this.opts.isMarkForCheck) this.cdr.markForCheck();
    if (this.opts.isDetectChanges) this.cdr.detectChanges();
  }

  setValue() {
    if (!this.isMulti) {
      this.context.$implicit = this.context.ngCond = this.conds[0].value;
      this.context.complete = this.complete ? this.complete[this.SINGLE_KEY] : false;
      this.context.error = this.error ? this.error[this.SINGLE_KEY] : undefined;
    } else {
      const conds = {};
      for (let i = 0, len = this.conds.length; i < len; i++) {
        conds[this.conds[i].key] = this.conds[i].value;
      }
      this.context.$implicit = this.context.ngCond = conds;
      this.context.complete = this.complete || {};
      this.context.error = this.error || {};
    }
  }

  private assertTemplate(property: string, templateRef: TemplateRef<any>|null): void {
    const isTemplateRefOrNull = Boolean(!templateRef || templateRef.createEmbeddedView);
    if (!isTemplateRefOrNull) {
      throw new Error(`Error passing wrong value to ${this.KEYWORD} - ${property} must be a template`);
    }
  }

  private clearItem(cond, isSetForNewCond) {
    if (cond.subscription && !cond.subscription.closed) cond.subscription.unsubscribe();
    cond.value = '';
    if (cond.subscription) cond.subscription = null;
    if (isSetForNewCond) {
      delete cond.obs;
      delete cond.subscription;
      delete cond.promise;
      delete cond.name;
    }
  }

  public ngOnDestroy() {
    if (this.conds) this.conds.forEach(cond => this.clearItem(cond, false));
  }
}
