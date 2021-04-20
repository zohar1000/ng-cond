*ngCond is an improved version of *ngIf directive, it has the following advantages:
* forget async pipe, the directive subscribes/unsubscribes to the observable/promise
* working with multiple observables and/or promises
* getting error/complete indications
* you can specify options for performance and behaviour
  
The package weight 1.5k and have no dependencies.<br/>

In the description below, referencing observables will include promises as well.

## Some examples

The examples below will use the following variables:
```angular2html
isInitialized: boolean
data: any
users$: Observable<User[]>
userCount$: Observable<number>
```

#### Simple condition

A simple condition without observables is implemented the same way as *ngIf:
```angular2html
<div *ngCond="isInitialized && data">...</div>
```

Observables are specified without the async pipe.<br/>
You can refer the observable via template variable, for BehaviourSubjects you can use the 'value' property.
```angular2html
<div *ngCond="users$ as users">
  <div>Users: {{users}}</div>
  <div>Users: {{users$.value}}</div>
</div>
```

#### Multiple conditions

Multiple observables are not allowed in *ngIf, you either need to combine them or is multiple *ngIf directives.<br/>

*ngCond enable it by specifying ***multi: true***, conditions are passed as object of key/value pairs, each value can 
be observable or expression (the expression should be without any observables).<br/>
The template variable specified in 'as' will result in an object containing the keys with the observable value for each key.<br/>

BehaviourSubjects can be referred directly (userCount$ in the example below).<br/>

The template will be shown when all the conditions are truthy.
```angular2html
<div *ngCond="{ users: users$, count: userCount$, isInit: isInitialized && data } as value; multi: true">
  <div>Users: {{value.users}}</div>
  <div>User count: {{userCount$.value}}</div>
</div>
```

#### Intellisense support

If your work with typescript and you bind a BehaviourSubject with a type, then your editor will provide you with 
intellisense when editing the template (this applies to *ngIf as well).<br/>

Provided the interface Person:
```angular2html
export interface Person {
  firstName: string;
  lastName: string;
  age: string;
}

export SomeComponent class {
  person: Person = {
    firstName: 'David',
    lastName: 'Bowie',
    age: 35
  };
  person$ = new BehaviorSubject<Person>(this.person);
}

Now when you type person$.value. your editor will provide you with intellisense and open a list with all 3 properties:
![](https://github.com/zohar1000/ng-cond/tree/main/projects/ng-cond/assets/intellisense.png)

```
## forget async pipe

The directive checks if the condition is observable, promise or regular boolean expression.<br/>
In case of observable, the directive subscribes on init and unsubscribe on destroy. for promises the directive
applies .then() to get the value.<br/>

> this makes async pipe redundant

Even if you do use async pipe, *ngCond will continue to work as usual. 


## then/else templates

Using then/else templates works the same as *ngIf, for example:
```angular2html
<div *ngCond="users$; else elseTemplate">...</div>

<ng-template #elseTemplate>...</ng-template>
```

## error/complete indications

The directive provides indications you can utilize in the template for observables which has errors and/or
have completed, they are provided as 'error' and 'complete' variables.<br/>

For a single condition, 'error' variable will hold the Error object and 'complete' variable will hold true or false.<br/>
You can receive those values by giving template variable names for those provided variables.<br/>
**note**: a promise is treated as completed upon resolve.
```
<div *ngCond="users$; let e=error; let c=complete">
    <div *ngCond="e">Error fetching users: {{e.message}}</div>
    <div *ngCond="c">The observable users$ has completed!</div>
</div>
```

For multiple conditions, 'error' and 'complete' will be provided as objects containing the indications per each key.<br/>
Those objects will be empty in case there is no data, but they will not be undefined as in single condition. 
```
<div *ngCond="{ users: users$, count: userCount$ }; multi: true; let e=error; let c=complete">
    <div *ngCond="e.users">Error fetching users: {{e.users.message}}</div>
    <div *ngCond="c.count">The observable userCount$ has completed!</div>
</div>
```

You can use the 'error' and 'complete' indications in the *elseTemplate*:
```
<div *ngCond="userCount$ as value; else elseTemplate">
  user count: {{value}}
</div>

<ng-template #elseTemplate let-e="error">
  <div *ngIf="e">Error: {{e.message}}</div>
</ng-template>
```

## Options

You can specify options for performance and behaviour by specifying 'opts' object with the options.<br/>
Options specified on a directive will have effect only for that directive, you can override the default options
values as described in the <em>Installation</em> section below. 


#### Performance options:

When working with observables and async pipe, the pipe calls markForCheck() method of ChangeDetectorRef for each change.<br/>
This is not always enough when working in zone less mode ({ngZone: 'noop'} in bootstrap), in this case detectChanges() should be called.</br>
The directive checks the application zone mode and calls the appropriate method, markForCheck() in zone mode and detectChanges() in zone less mode.<br/>

You can override this behaviour by specifying the options:

| Option        |               | 
|------------- |:-------------|
| isMarkForCheck | regardless of zone mode, call markForCheck() per each change or not.<br/>default: method is called only in zone mode |
| isDetectChanges | regardless of zone mode, call detectChanges() per each change or not.<br/>default: method is called only in zone less mode |


#### Behaviour options:

| Option        |               | 
| ------------- |:-------------|
| isShowOnValue | when **true**, a condition is regarded as falsy only if its value is undefined, all other values are regarded as truthy, including false and 0.<br/>default: false. |
| isShowOnEmit  | when **true**, a condition is regarded as falsy only if its value is undefined or null, all other values are regarded as truthy, including false and 0.<br/>default: false. |
| isThrowOnError | you can specify if the directive will throw an error in case the observable has error.<br/>default: false |
| isClearValueOnError | when an observable emits value and after that emits error, then the value still remains and shown in the template.<br/> specifying **true** will change the observable value to undefined upon error.<br/>default: false |


## Installation

```angular2html
  npm install ng-cond
```

After that, import NgCondModule in your shared module.
```angular2html
import { NgCondModule } from 'ng-cond';

@NgModule(
  imports: [
    NgCondModule
  ]
})
export class SharedModule {}
```

#### overriding default options

You can globally override the default options values described above.<br/>
When importing the module, call forChild() and pass the options you want to override as a parameter.
```angular2html
import { NgCondModule } from 'ng-cond';

@NgModule({
  imports: [
      NgCondModule.forChild({ isClearValueOnError: true })
  ],
  exports: [
    NgCondModule
  ]
})
export class SharedModule {}
```
