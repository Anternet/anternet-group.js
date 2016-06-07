const EventEmitter = require('events');
const async = require('async');
const Anternet = require('anternet');
const Peer = require('anternet-peer');
const PeersSet = require('anternet-peers-set');
const Extension = require('./lib/extension');

const BUFFER_ENCODING = 'hex';
const GET_LIMIT = 50;
const DEFAULT_LIMIT = 1000;
const UPDATE_RATIO = 0.1;
const FIND_EACH_LIMIT = 10;

class Group extends EventEmitter {

  constructor(anternet, hash, limit) {
    super();

    this.anternet = anternet;
    this.limit = limit || DEFAULT_LIMIT;

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


  /** static methods **/

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


  /** getters **/

  get id() {
    return this.hash.toString(BUFFER_ENCODING);
  }

  get size() {
    return this.peers.size;
  }


  /** peers methods **/

  add(port, address) {
    // const rinfo = this.anternet.address();
    // if (port === rinfo.port && address === rinfo.address) return this;

    return this.peers.add(new Peer(port, address));
  }

  has(port, address) {
    return this.peers.has(new Peer(port, address));
  }

  remove(port, address) {
    return this.peers.delete(new Peer(port, address));
  }

  forEach(callback, thisArg) {
    this.peers.forEach(callback, thisArg);
    return this;
  }

  trim(target = this.limit) {
    if (this.size <= target) return this;

    const it = this.peers.values();
    for (let i = target; i > 0; i--) it.next();

    let item = it.next();
    do {
      this.peers.delete(item.value);
      item = it.next();
    } while (!item.done);

    return this;
  }


  /** group methods **/

  get(port, address, callback) {
    this.extension.get(this.hash, GET_LIMIT, port, address, callback);
    return this;
  }

  findMore(limit, callback) {
    let found = 0;

    const queue = async.queue((peer, next) => {
      if (found >= limit) return next();

      this.get(peer.port, peer.address, (err, peersSet) => {
        if (err) {
          this.peers.delete(peer);
          return next();
        }

        peersSet.forEach(newPeer => {
          if (this.peers.has(newPeer)) return;

          found++;
          this.peers.add(newPeer);
          queue.push(newPeer);
        });

        next();
      });
    }, FIND_EACH_LIMIT);

    for (const peer of this.peers.values()) {
      queue.push(peer);
    }

    queue.drain = () => {
      callback(null, found);
    };

    return this;
  }

  update(callback) {
    let limit = this.limit - this.size;
    if (limit <= 0) limit = Math.round(this.limit * UPDATE_RATIO);

    this.findMore(limit, (err, found) => {
      if (!err) this.trim(limit);

      if (callback) callback(found);
      this.emit('update', found);
    });

    return this;
  }

  destroy() {
    this.extension.leave(this);

    this.extension = null;
    this.peers = null;

    process.nextTick(() => this.emit('destroy'));
    return this;
  }
}

module.exports = Group;
