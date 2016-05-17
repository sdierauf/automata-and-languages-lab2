// Stefan Dierauf
// Lab 2 automata and languages

// Deps
var Graph = require('graphlib').Graph;
var exec = require('child_process').exec;

var alg = require('graphlib').alg;
var fs = require('fs');
var prompt = require('prompt-sync')();
var GrammarGraph = require('grammar-graph');
var copyGraph = function(g) {
  return require('graphlib').json.read(JSON.parse(JSON.stringify(require('graphlib').json.write(g))));
}


// Steps:
// get input
// var cfgFile = prompt('cfg? ');
cfgFile = 'lab2/Simple/simple.cfg';
cfgFile = 'lab2/EvenOdd/EvenOdd.cfg';
// cfgFile = 'lab2/Vote/Vote_ne.cfg';
var cfgContent = fs.readFileSync(cfgFile, 'ascii');

// var specFile = prompt('spec? ');
specFile = 'lab2/Simple/simple.spec';
// specFile = 'lab2/Simple/allallowed.spec';
specFile = 'lab2/EvenOdd/EvenOdd1b.spec';
// specFile = 'lab2/Vote/Vote_v.spec';
var specContent = fs.readFileSync(specFile, 'ascii');

var deepCopy = function (g) {
  return JSON.parse(JSON.stringify(g));
}

// Graph utility functions
var getFinalStates = function(g) {
  var states = [];
  g.nodes().forEach(function(node) {
    node = g.node(node);
    if (node.terminal) {
      states.push(node.name);
    }
  });
  return states;
}

var symbol = function(s, p, e) {
  // if (!s) {
  //   console.trace()
  // }
  // if (s == 'q2' && p == 'c34m5p1r' && e == 'q3') {
  //   console.trace()
  // }
  return "["  + s + "-" + p + "-" + e + "]"
}

var getPerm = function(g, n) {
  var repPerm = function(list, n, cur, f) {
    // console.log(cur)
    if (cur.length == n) {
      f.push(cur)
    } else {
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        var t = cur.concat()
        t.push(el);
        repPerm(list, n, t, f)
      }
    }
  }

  var perms = [];
  // console.log(g.nodes())
  repPerm(g.nodes(), n, [], perms)
  return perms;
}

var graph2Dot = function(g, name, entryP) {
  var out = "digraph finite_state_machine {\n"
  out += "\trankdir=LR;\n"
  var entryPInv = {};
  Object.keys(entryP).forEach(function(k) {
    var v = entryP[k];
    entryPInv[v] = k
  });
  // console.log(entryPInv)
  g.edges().forEach(function(e) {
    if (entryPInv[e.v]) {
      var s =  "\t" + entryPInv[e.v] + " ->  " + e.v + ";\n"
      if (out.indexOf(s) < 0) {
        out += s
      }
    }
    out += "\t"
    out += e.v + " -> " + e.w + " [ label = \"" + e.name + "\"];\n"
  })
  out += "}"
  var fname = name + '.dot'
  fs.writeFileSync(fname, out, 'ascii');
  var child = exec('dot -O -Tpng ' + fname,
    (error, stdout, stderr) => {
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);
      // if (error !== null) {
      //   console.log(`exec error: ${error}`);
      // }
    });
}

var spec2Dot = function(g, name) {
  var out = "digraph finite_state_machine {\n"
  out += "\trankdir=LR;\n"
  out += "\tnode [shape = doublecircle]; "
  out += getFinalStates(g).join('; ') + "\n"
  out += "\t node [shape = circle];\n"
  g.edges().forEach(function(e) {
    out += "\t"
    out += e.v + " -> " + e.w + " [ label = \"" + e.name + "\"];\n"
  })
  out += "}"
  var fname = name + '.dot'
  fs.writeFileSync(fname, out, 'ascii');
  var child = exec('dot -O -Tpng ' + fname,
    (error, stdout, stderr) => {
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);
      // if (error !== null) {
      //   console.log(`exec error: ${error}`);
      // }
    });
}

var grammar2Dot = function (g, name) {
  var out = "digraph finite_state_machine {\n"
  out += "\trankdir=LR;\n"
  var t = deepCopy(g);
  Object.keys(g).forEach(function(k) {
    var rules = g[k];
    rules.forEach(function (rule) {
      out += '\t';
      k = k.replace(/\[/g, "")
      k = k.replace(/\]/g, "")
      k = k.replace(/-/g, "_")
      rule = rule.replace(/\[/g, "")
      rule = rule.replace(/\]/g, "")
      rule = rule.replace(/-/g, "_")
      var compressed = rule.replace(/#/g, "LL")
      var pieces = []
      if (rule.indexOf('#') > -1) {
        pieces = rule.split('#');
      }
      if (!t[compressed]) {
        t[compressed] = [];
      }
      t[compressed] = t[compressed].concat(pieces)
    }) 
  })
  Object.keys(t).forEach(function (k) {
    var rules = t[k];
    rules.forEach(function (rule) {
      out += '\t';
      k = k.replace(/\[/g, "")
      k = k.replace(/\]/g, "")
      k = k.replace(/-/g, "_")
      rule = rule.replace(/\[/g, "")
      rule = rule.replace(/\]/g, "")
      rule = rule.replace(/-/g, "_")
      var compressed = rule.replace(/#/g, "LL")
      if (rule.indexOf('#') > -1) {

      }
      var s = k + ' -> ' + compressed + ';\n'
      out += s;
    })
  })
  out += '}'
  var fname = name + '.dot'
  fs.writeFileSync(fname, out, 'ascii');
  var child = exec('dot -O -Tpng ' + fname,
    (error, stdout, stderr) => {
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);
      // if (error !== null) {
      //   console.log(`exec error: ${error}`);
      // }
    });
}



// parse into graphs
// console.log(cfgContent);
// console.log(specContent);


// 1. Process an input file describing the flow graph FG, and store it in some
// suitable data structure.
var entryPoints = {};
var cfg = new Graph({multigraph: true});
cfgContent.split('\n').forEach(function(line) {
  if (line.length == 0) { return }
    var parts = line.split(/\s+/);
  parts = parts.map(function (el) {return el.trim()});
  var type = parts[0];
  if (type == 'node') {
    var node = parts[1];
    var method = parts[2].match(/\([a-zA-Z0-9-_]+\)/g)[0].match(/[a-zA-Z0-9-_]+/g)[0];
    // if (method.contains("main")) {
    //   method = "main"
    // }
    var entry = parts[3];
    if (entry == 'entry') {
      entryPoints[method + ""] = node;
    }
    cfg.setNode(node, {name: node, method: method, entry: entry});
  } else if (type == 'edge') {
    var node = parts[1];
    var dest = parts[2];
    var label = parts[3];
    cfg.setEdge(node, dest, label, label);
  } else {
    console.log('what is this line: ' + line);
  }
});
console.log(entryPoints);

// 2. Process an input file with the specification DFA, and store it in some
// suitable data structure.
var spec = new Graph({multigraph: true});
specContent.split('\n').forEach(function(line) {
  if (line.length == 0) { return }
    var parts = line.split('-');
  var node;
  var dest;
  var edge;
  var nodeIsFinal = false;
  var destIsFinal = false;
  var nodeIsStart = false;
  if (parts[0].indexOf('=>') > -1) {
    nodeIsStart = true;
  }
  if (parts[0].indexOf('(') > -1) {
    nodeIsFinal = true;
  }
  node = {name: parts[0].match(/[a-zA-Z0-9-_]+/g)[0], terminal: nodeIsFinal};
  spec.setNode(node.name, node);
  edge = parts[1].match(/[a-zA-Z0-9-_]+/g)[0];
  if (parts[2].indexOf('(') > -1) {
    destIsFinal = true;
  }
  dest = {name: parts[2].match(/[a-zA-Z0-9-_]+/g)[0], terminal: destIsFinal}
  spec.setNode(dest.name, dest);
  spec.setEdge(node.name, dest.name, edge, edge);
});
spec2Dot(spec, 'spec')

graph2Dot(cfg, 'cfg', entryPoints)


// return;
// 3. Compute the complement of the DFA (see page 135 of the course book).
var complementSpec = copyGraph(spec);
// cfg.nodes().forEach(function(node) {
//   console.log(cfg.node(node))
// });
// console.log(spec.nodes())

complementSpec.nodes().forEach(function(node) {
  var complementNode = complementSpec.node(node);
  complementNode.terminal = !complementNode.terminal;
  complementSpec.setNode(node, complementNode);
});

// Object.keys(entryPoints).forEach(function(k) {
//   var found = false
//   complementSpec.edges().forEach(function (e) {
//     // console.log(e)
//     if (e.name == k) {
//       found = true
//       return;
//     }
//   })
//   if (!found) {
//     complementSpec.nodes().forEach(function(node) {
//       complementSpec.setEdge(node, node, k, k)
//     })
//   }
// })
// spec2Dot(complementSpec, 'complement')






// 4. Compute the product of FG and the complement DFA, resulting in a
// context-free grammar Gprod.
var Gprod = {};
// • P is a set of productions defined as follows:
// 1. For every final state qi ∈ QF , a production S → [q0 v0 qi
// ], where v0
// is the entry node of the main method.
Gprod["S"] = [];
getFinalStates(complementSpec).forEach(function(term) {
  var m = entryPoints["main"];
  var sym = symbol('q0', m, term);
  // console.log(sym);
  Gprod["S"].push(sym);
})
// console.log(Gprod);

// 2. For every transfer edge vi
// −→ vj of F and every state sequence qaqb ∈
// Q2
// , a production [qa vi qb] → [qa vj qb].
// complementSpec.nodes().forEach(function (node) {
var out = getPerm(complementSpec, 2)
// console.log(out)
// return;
// for each pair in out
// console.log(out)
out.forEach(function (p) {
  var s1 = p[0];
  var s2 = p[1];
  // console.log(edge)
  cfg.nodes().forEach(function(flowNode) {
    cfg.outEdges(flowNode).forEach(function (flowOut) {
      var v1 = flowOut.v;
      var v2 = flowOut.w;
      if (flowOut.name == 'eps' || !entryPoints[flowOut.name]) {
      // if (flowOut.name == 'eps' || !entryPoints[flowOut.name]) {
        var symA = symbol(s1, v1, s2);
        var symB = symbol(s1, v2, s2);
        if (!Gprod[symA]) Gprod[symA] = [];
        Gprod[symA].push(symB);
      }
    })
  })
})
// })


// 3. For every call edge vi
// m−→ vj and every state sequence qaqbqcqd ∈ Q4
// ,
// a production [qa vi qd] → [qa m qb][qb vk qc][qc vj qd], where vk is the
// entry node of method m.
// get all sets of 4 states

// var get4 = function(g, method) {
//   var seqs = [];
//   g.nodes().forEach(function(a) {
//     g.outEdges(a).forEach(function (outA) {
//       // if (outA.name != method) {
//       //   return;
//       // }
//       var b = outA.w;
//       g.outEdges(b).forEach(function (outB) {
//         var c = outB.w;
//         g.outEdges(c).forEach(function(outC) {
//           var d = outC.w;
//           seqs.push([a, b, c, d].join(","));
//         })
//       })
//     })
//   });
//   var t = Array.from(new Set(seqs));
//   var ret = [];
//   t.forEach(function (s) {
//     ret.push(s.split(','));
//   })
//   return ret;
// }

var seq4 = getPerm(complementSpec, 4);
cfg.edges().forEach(function (e) {
  var vi = e.v;
  var vj = e.w;
  // if (!entryPoints[e.name]) {
  //     var v1 = vi;
  //     var v2 = vj;
  //     out.forEach(function (p) {
  //       var s1 = p[0];
  //       var s2 = p[1];
  //       // console.log(edge)
  //       var symA = symbol(s1, v1, s2);
  //       var symB = symbol(s1, v2, s2);
  //       if (!Gprod[symA]) Gprod[symA] = [];
  //       Gprod[symA].push(symB);
  //     })
  //     return;
  // }
  // console.log(e);
  if (entryPoints[e.name]) {
    var m = e.name;
    var vk = entryPoints[m];
    var found = false
    // console.log(m);
    complementSpec.edges().forEach(function (e) {
      // console.log(e)
      if (e.name == m) {
        found = true
      }
    })
    if (!found) {
      var v1 = vi;
      var v2 = vj;
      out.forEach(function (p) {
        var s1 = p[0];
        var s2 = p[1];
        // console.log(edge)
        var symA = symbol(s1, v1, s2);
        var symB = symbol(s1, v2, s2);
        if (!Gprod[symA]) Gprod[symA] = [];
        Gprod[symA].push(symB);
      })
      return;
    }
    //     } else {
    //   console.log('was found')
    // }
    // e is a call edge
     // a production [qa vi qd] → [qa m qb][qb vk qc][qc vj qd], where vk is the
    // entry node of method m.
    // console.log(seq4)
    seq4.forEach(function (seq) {
      var a = seq[0];
      var b = seq[1];
      var c = seq[2];
      var d = seq[3];
      var sym1 = symbol(a, vi, d);
      var sym2 = symbol(a, m, b);
      var sym3 = symbol(b, vk, c);
      var sym4 = symbol(c, vj, d);
      if (!Gprod[sym1]) {
        Gprod[sym1] = []
      }
      var triple = [sym2, sym3, sym4];
      if (!found) {
        Gprod[sym1].push(sym4);
      } else {
        Gprod[sym1].push(triple.join('#'));
      }
      
    })
  }
})

// 4. For every return node vi ∈ R and every state qj ∈ Q, a production
// [qj vi qj ] → .
var retNodes = [];
cfg.nodes().forEach(function(n) {
  var node = cfg.node(n);
  if (node.entry == 'ret') {
    retNodes.push(node);
  }
});
// console.log(retNodes);
complementSpec.nodes().forEach(function(n) {
  retNodes.forEach(function (ret) {   
    var sym = symbol(n, ret.name, n);
    if (!Gprod[sym]) {
      Gprod[sym] = [];
    }
    Gprod[sym].push('eps');
  });
});

// 5. For every transition δ(qi
// , a) = qj of D, a production [qi a qj ] → a.
complementSpec.edges().forEach(function (e) {
  // console.log(e);
  var sym = symbol(e.v, e.name, e.w);
  if (!Gprod[sym]) Gprod[sym] = [];
  Gprod[sym].push(e.name);
})

// uniq all right sides
Object.keys(Gprod).forEach(function (k) {
  var r = Gprod[k]
  var t = Array.from(new Set(r));
  Gprod[k] = t
})

// console.log(Gprod);
// 5. Test Gprod for lang
var grammar = new GrammarGraph(Gprod);
// console.log(grammar.vertices());
// console.log(grammar)


var old = deepCopy(Gprod);
// eliminate all nongenerating symbols
// eliminate all rules that are now useless
var onlyGenerating = old;
var dirty = true;
while (dirty) {
  dirty = false;
  old = deepCopy(onlyGenerating);
  onlyGenerating = {};
  Object.keys(old).forEach(function(k) {
    var nongenerating = new Set();
    var rules = old[k];
    rules.forEach(function(rule) {
      var pieces = rule.split('#');
      pieces.forEach(function(piece) {
        // if it's a terminal, return
        if (piece.indexOf('[') < 0) {
          return;
        }
        if (!old[piece]) {
          nongenerating.add(piece);
        }
      })
    })
    var newRules = rules.filter(function(rule) {
      var ruleIsGenerating = true;
      var pieces = rule.split('#');
      pieces.forEach(function(piece) {
        // if it's a terminal, return
        if (piece.indexOf('[') < 0) {
          return;
        }
        if (nongenerating.has(piece)) {
          ruleIsGenerating = false;
          return;
        }
      })
      return ruleIsGenerating;
    })
    if (newRules.length > 0) {
      onlyGenerating[k] = newRules;
    }
    if (rules.length > newRules.length) {
      dirty = true;
    }
  })
}


var replaceHashes = function(g) {
  var n = deepCopy(g);
  // console.log(n);
  var keys = Object.keys(n);
  for (var i = 0; i < keys.length ; i++) {
    var key = keys[i]
    var vals = n[key]
    var newVals = vals.map(function (elem) {
      return elem.replace(/#/g, " ")
    })
    n[key] = newVals;
  }
  // console.log(n);
  return deepCopy(n);
}
// console.log(Gprod)

// console.log(old);
// if (!old["S"]) {
//   console.log('spec is sound!!!!');
//   return;
// }
// console.log(replaceHashes(Gprod));
// console.log(onlyGenerating)
if (!onlyGenerating['S']) {
  console.log('the spec is accepted!');
  // return;
}
console.log(onlyGenerating)
var g = new GrammarGraph(replaceHashes(onlyGenerating))
// console.log(g.vertices())
var guide = g.createGuide('S')
var i = 1;
var MAX_DEPTH = 6;
var found = false;
var recog = g.createRecognizer('S');
var out = [];


var descendTree = function (node, s) {
  // console.log(s);
  // if (s && recog.isValid(s) && s.indexOf("[") < 0 && node.next.length == 0 && s.trim().length > 0) {
  if (s && recog.isValid(s) && node.next.length == 0) {
    found = true;
    out.push('"' + s + '"')
  }
  node.next.forEach(function (n) {
    var newS = s + ' ' + n.val;
    descendTree(n, newS)
  })
}
while (!found && i < MAX_DEPTH) {
  var choices = guide.choices(i)
  choices.forEach(function(elem) {
  // console.log(elem)
    if (elem.next) {
      descendTree(elem, elem.val)
    }
  })
  i++;
}


// // out = out.filter(function(el) {
// //   return el.indexOf('[') < 0 && el.indexOf('eps') < 0
// // })

if (out.length == 0) {
  console.log('could not find any counter examples by max depth ' + MAX_DEPTH);
}
if (out.length == 1) {
  console.log('found counter example ' + out[0] + ' at depth ' + i);
}
if (out.length > 1) {
  console.log('found counter examples ' + out + " at depth " + i);
}

