import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Person {
  firstName: string;
  lastName: string;
  age: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  person: Person = {
    firstName: 'David',
    lastName: 'Bowie',
    age: 35
  };
  person$ = new BehaviorSubject<Person>(this.person);
  data$ = new BehaviorSubject(null);
  title = 'Tester App';
  someValue$ = new BehaviorSubject(null);
  users$ = new BehaviorSubject(null);
  someError$ = new BehaviorSubject(null);
  users = [
    { id: 1, name: 'David Bowie' },
    { id: 2, name: 'George Bush' }
  ];

  constructor() {
    this.someValue$.next('Some Value');
    this.users$.next(this.users);

    this.someError$.next('Some Value Before Error');
    setTimeout(() => this.someError$.error(new Error('Some Error')), 2000);
    // setTimeout(() => this.someError$.error(new Error('Some Error')), 100);
    // setTimeout(() => this.someError$.complete(), 3000);
// console.log('==> this.someError$.value:', this.someError$.getValue());
  }
}
