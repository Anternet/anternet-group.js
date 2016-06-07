const Anternet = require('anternet');
const PeersSet = require('anternet-peers-set');

const BUFFER_ENCODING = 'hex';

const MSG_TYPE_GET = 0x02;
const MSG_TYPE_LEFT = 0x03;

class Extension extends Anternet.Extension {

  init() {
    this.groups = new Map();
  }

  destroy() {
    this.groups.forEach(group => group.destroy());
    this.groups = null;

    super.destroy();
  }

  getEvents() {
    return {
      [MSG_TYPE_GET]: this.onGet.bind(this),
      [MSG_TYPE_LEFT]: this.onLeft.bind(this),
    };
  }

  join(group) {
    this.groups.set(group.id, group);
  }

  leave(group) {
    this.groups.delete(group.id);

    group.forEach(peer => {
      this.left(group.hash, peer.port, peer.address, () => {});
    });
  }

  get(hash, limit, port, address, callback) {
    this.anternet.request(MSG_TYPE_GET, [hash, limit], port, address, (err, args) => {
      if (err) return callback(err);

      if (args.length < 1 || !(args[0] instanceof PeersSet)) {
        return callback(new Error('Unexpected response'));
      }

      callback(null, args.shift(), args);
    });
  }

  left(hash, port, address, callback) {
    this.anternet.request(MSG_TYPE_LEFT, [hash], port, address, callback);
  }

  onGet(rid, args, rinfo) {
    if (args.length < 1 || !(args[0] instanceof Buffer)) {
      this.anternet.error(Anternet.Errors.BAD_REQUEST, rid, 'Unknown group-get format',
          rinfo.port, rinfo.address);
      return;
    }

    const hash = args[0];
    let limit = 0;

    if (args.length > 1) {
      limit = args[1];
      if (!Number.isInteger(limit) || limit < 0) {
        this.anternet.error(Anternet.Errors.BAD_REQUEST, rid, 'Invalid limit',
            rinfo.port, rinfo.address);
        return;
      }
    }

    const id = hash.toString(BUFFER_ENCODING);
    const group = this.groups.get(id);

    if (!group) {
      this.anternet.error(Anternet.Errors.NOT_FOUND, rid, 'Group not found',
          rinfo.port, rinfo.address);
      return;
    }

    group.emit('get', rinfo, limit);
    if (group.size < group.limit) group.add(rinfo.port, rinfo.address);

    const res = [];
    if (limit) res.push(group.peers.slice(0, limit));

    this.anternet.response(rid, res, rinfo.port, rinfo.address);
  }

  onLeft(rid, args, rinfo) {
    if (args.length < 1 || !(args[0] instanceof Buffer)) {
      this.anternet.error(Anternet.Errors.BAD_REQUEST, rid, 'Unknown group-left format',
          rinfo.port, rinfo.address);
      return;
    }

    const hash = args[0];
    const id = hash.toString(BUFFER_ENCODING);
    const group = this.groups.get(id);

    if (!group) {
      this.anternet.error(Anternet.Errors.NOT_FOUND, rid, 'Group not found',
          rinfo.port, rinfo.address);
      return;
    }

    group.remove(rinfo.port, rinfo.address);
    group.emit('left', rinfo);

    this.anternet.response(rid, [], rinfo.port, rinfo.address);
  }
}

module.exports = Extension;
