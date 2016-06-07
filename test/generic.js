const assert = require('assert');
const Anternet = require('anternet');
const Group = require('../');
const { describe, it } = global;

describe('generic', () => {
  it('should update group', (done) => {
    const id = '00112233445566778899';
    const peers = [];
    const count = 10;

    for (let i = 0; i < count; i++) {
      const address = '127.0.0.1';
      const port = 12000 + i;
      const anternet = new Anternet();
      const group = new Group(anternet, id);

      peers.push({
        anternet,
        group,
        port,
        address,
      });

      anternet.bind(port, address);
    }

    for (let i = 1; i < count; i++) {
      peers[0].group.add(peers[i].port, peers[i].address);
    }

    peers[1].group.add(peers[0].port, peers[0].address);

    peers[1].group.update(found => {
      assert.equal(found, count - 1);
      assert.equal(peers[0].group.size, count - 1);

      assert.equal(peers[1].group.size, count);
      assert.equal(peers[2].group.size, 1);

      done();
    });
  });
});
