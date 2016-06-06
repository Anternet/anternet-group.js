# anternet-group.js

[![build](https://img.shields.io/travis/Anternet/anternet-group.js.svg?branch=master)](https://travis-ci.org/Anternet/anternet-group.js)
[![npm](https://img.shields.io/npm/v/anternet-group.svg)](https://npmjs.org/package/anternet-group)
[![Join the chat at https://gitter.im/Anternet/anternet.js](https://badges.gitter.im/Anternet/anternet.js.svg)](https://gitter.im/Anternet/anternet.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/l/anternet-group.svg)](LICENSE)


[Anternet](https://www.npmjs.com/package/anternet) library for join and get other peers based on a group id.

## Example

```js
const Anternet = require('anternet');
const Group = require('anternet-group');

const id = '<< hash >>';

const anternet = new Anternet();
const group = new Group(anternet, id);

// other peer address
const address = '127.0.0.1';
const port = 12345;

group.add(port, address);
console.log(group.size); // 1

group.get(port, address, (err, peers) => {
  if (err) throw err;
  
  peer.forEach(peer => console.log(`${peer.address}:${peer.port}`));
});

// find and add more peers to the group
const limit = 500;
group.findMore(limit, (err, found) => {
  if (err) throw err;
  
  console.log(`found ${found} more peers to group`);
  group.forEach(peer => console.log(`${peer.address}:${peer.port}`));
});
```

## License

[MIT License](LICENSE).
Copyright &copy; 2016 [Moshe Simantov](https://github.com/moshest)



