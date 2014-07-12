function DispatchNode() {
  this.method = null;
  this.args = 0;
  this.children = {};
}

DispatchNode.prototype.compile = function(level, callParent) {
  var callMethod = callParent;

  if (this.method) {
    callMethod = 'this.' + this.method + '(exp)';
  }

  var code = 'switch(exp[' + level + ']) {';
  var empty = true;

  for(var key in this.children) {
    code += "\ncase '" + key +"':\n";
    code +=  this.children[key].compile(level + 1, callMethod) + ';';

    empty = false;
  }

  if (empty) {
    if (!this.method) {
      throw new Error('Invalid dispatcher node');
    }
    return 'return ' + callMethod;
  }

  code += '\ndefault:\n return ' + (callMethod || 'exp') + ';\n}';

  return code;
};

function Dispatcher() {};

(function() {
  // Dispatching

  this.exec = function(exp) {
    return this.compile(exp);
  };

  this.compile = function(exp) {
    return this.dispatcher(exp);
  };

  this.dispatcher = function(exp) {
    return this.replaceDispatcher(exp);
  };

  this.dispatchedMethods = function() {
    var methods = [];

    for (var key in this) {
      if (/^on(_[a-zA-Z0-9]+)*$/.test(key)) {
        methods.push(key);
      }
    }
    return methods;
  };

  this.replaceDispatcher = function(exp) {
    var tree = new DispatchNode;
    var dispatchedMethods = this.dispatchedMethods();
    for (var i = 0, method; method = dispatchedMethods[i]; i++) {
      var types = method.split(/_/).splice(1);
      var node = tree;
      for (var j = 0, type; type = types[j]; j++) {
        var n = node.children[type];
        node = node.children[type] = n || new DispatchNode;
      }
      node.args = this[method].length;
      node.method = method;
    }
    var code = '[function(exp) {\n' + tree.compile(0) + ';' + '}]';
    this.dispatcher = eval(code)[0];
    return this.dispatcher(exp);
  };
}).call(Dispatcher.prototype);

module.exports = Dispatcher;