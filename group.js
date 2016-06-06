const EventEmitter = require('events');
const Anternet = require('anternet');
const Peer = require('anternet-peer');
const PeersSet = require('anternet-peers-set');
const Extension = require('./lib/extension');

const BUFFER_ENCODING = 'hex';

class Group extends EventEmitter {

  constructor(anternet, hash) {
    super();

    if (hash instanceof Buffer) {
      this.hash = hash;
    } else if (typeof hash === 'string') {
      this.hash = Buffer.from(hash, BUFFER_ENCODING);
    } else {
      throw new Error('`id` must be a Buffer or string');
    }

    this.extension = this.constructor.extend(anternet);
    this.peers = new PeersSet();

    this.extension.join(this);
  }

  static extend(anternet) {
    if (!(anternet instanceof Anternet)) {
      throw new Error('Invalid instance; Anternet instance expected');
    }

    PeersSet.extend(anternet);
    return anternet.extend(Extension);
  }

  static release(anternet) {
    if (!(anternet instanceof Anternet)) {
      throw new Error('Invalid instance; Anternet instance expected');
    }

    return anternet.release(Extension);
  }

  get id() {
    return this.hash.toString(BUFFER_ENCODING);
  }

  get size() {
    return this.peers.size;
  }

  add(port, address) {
    return this.peers.add(new Peer(port, address));
  }

  has(port, address) {
    return this.peers.has(new Peer(port, address));
  }

  remove(port, address) {
    return this.peers.delete(new Peer(port, address));
  }

  forEach(callback) {
    this.peers.forEach(callback);
    return this;
  }

  // listen(anternet, callback) {
  //   if (this.extension) throw new Error('This channel already attached');
  //
  //   this.extension = this.constructor.extend(anternet);
  //   this.extension.attach(this);
  //
  //   if (callback) this.on('broadcast', callback);
  //   return this;
  // }
  //
  leave() {
    this.extension.leave(this);

    this.extension = null;
    this.peers = null;

    process.nextTick(() => this.emit('leave'));
    return this;
  }
}

module.exports = Group;
