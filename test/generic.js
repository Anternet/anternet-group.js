const assert = require('assert');
const Anternet = require('anternet');
const Group = require('../');
const { describe, it } = global;

describe('generic', () => {
  it('should receive broadcast', (done) => {
    const id = 'aabbccddeeff0011';

    const anternet = new Anternet();
    const group = new Group(anternet, id);

    const anternet2 = new Anternet();
    const group2 = new Group(anternet2, id);

    anternet2.bind();
    const peer2 = anternet2.address();

    group.add(peer2.port, peer2.address);

  });
});
