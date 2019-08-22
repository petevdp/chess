const { Subject } = require('rxjs');
const { map, from } = require('rxjs/operators');


subject = new Subject().pipe(map(num => num ** 2))
  .subscribe((num) => {
    console.log(num);
  });

const nums = from([1,2,3]);

nums.subscribe(subject);
