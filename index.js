// Stefan Dierauf
// Lab 2 automata and languages

// Deps
var Graph = require('graphlib').Graph;
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
// cfgFile = 'lab2/EvenOdd/EvenOdd.cfg';
// cfgFile = 'lab2/Vote/Vote_ne.cfg';
var cfgContent = fs.readFileSync(cfgFile, 'ascii');

// var specFile = prompt('spec? ');
specFile = 'lab2/Simple/simple.spec';
// specFile = 'lab2/EvenOdd/EvenOdd1b.spec';
// specFile = 'lab2/Vote/Vote_v.spec';
var specContent = fs.readFileSync(specFile, 'ascii');

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

// for every call that isn't specced in the dfa, add to the dfa
// looping to itself

// for every entry point key, make sure there's an edge with that in the dfa
// console.log(spec)
Object.keys(entryPoints).forEach(function (meth) {
  var found = false;
  spec.edges().forEach(function (e) {
    if (e.name == meth) {
      found = true;
    }
  })
  if (found) {
    return
  }
  var newName = 'z' + meth;
  spec.setNode(newName, newName)
  spec.setEdge(newName, newName, meth, meth)
})


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
  if (s == 'q1' && p == 'v4' && e == 'q2') {
    console.trace()
  }
  return "["  + s + "-" + p + "-" + e + "]"
}

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
complementSpec.nodes().forEach(function (node) {
  var out = complementSpec.outEdges(node);
  // for each pair in out
  // console.log(out)
  out.forEach(function (edge) {
    var s1 = edge.v;
    var s2 = edge.w;
    cfg.nodes().forEach(function(flowNode) {
      cfg.outEdges(flowNode).forEach(function (flowOut) {
        var v1 = flowOut.v;
        var v2 = flowOut.w;
        if (flowOut.name == 'eps' || !entryPoints[flowOut.name]) {
          var symA = symbol(s1, v1, s2);
          var symB = symbol(s1, v2, s2);
          if (!Gprod[symA]) Gprod[symA] = [];
          Gprod[symA].push(symB);
        }
      })
    })
  })
})


// 3. For every call edge vi
// m−→ vj and every state sequence qaqbqcqd ∈ Q4
// ,
// a production [qa vi qd] → [qa m qb][qb vk qc][qc vj qd], where vk is the
// entry node of method m.
// get all sets of 4 states
var get4 = function(g, method) {
  var seqs = [];
  g.nodes().forEach(function(a) {
    g.outEdges(a).forEach(function (outA) {
      if (outA.name != method) {
        return;
      }
      var b = outA.w;
      g.outEdges(b).forEach(function (outB) {
        var c = outB.w;
        g.outEdges(c).forEach(function(outC) {
          var d = outC.w;
          seqs.push([a, b, c, d].join(","));
        })
      })
    })
  });
  var t = Array.from(new Set(seqs));
  var ret = [];
  t.forEach(function (s) {
    ret.push(s.split(','));
  })
  return ret;
}


cfg.edges().forEach(function (e) {
  // console.log(e);
  if (e.name != 'eps') {
    var vi = e.v;
    var vj = e.w;
    var m = e.name;
    var vk = entryPoints[m];
    if (!vk) {
      // console.log("entryPoints " + m + " is undefined!")
      return;
    }
    var found = false
    console.log(m);
    complementSpec.edges().forEach(function (e) {
      // console.log(e)
      if (e.name == m) {
        found = true
      }
    })
    if (!found) {
      return;
    // }
    } else {
      console.log('was found')
    }
    // e is a call edge
     // a production [qa vi qd] → [qa m qb][qb vk qc][qc vj qd], where vk is the
    // entry node of method m.
    var seq4 = get4(complementSpec, m);
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
      Gprod[sym1].push([sym2, sym3, sym4].join('#'));
      if (m.indexOf('init') > -1) {
        console.log(sym1 + ": " + Gprod[sym1])
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
console.log(retNodes);
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


// console.log(Gprod);
// 5. Test Gprod for lang
var grammar = new GrammarGraph(Gprod);
// console.log(grammar.vertices());
// console.log(grammar)

var terminals = new Set();
var deepCopy = function (g) {
	return JSON.parse(JSON.stringify(g));
}
var dirty = true;
var old = deepCopy(Gprod);
// console.log(Gprod)
// console.log("Gprod[S]: " + Gprod["S"])
// console.log("old[S]: " + old["S"])
var counter = 0;
while (dirty) {
	dirty = false;
	G = {};
	Object.keys(old).forEach(function (k) {
		var arr = old[k]
		// remove each value from rhs that doesn't have a key
		var hasVals = arr.filter(function (el) {
			var pieces = el.split("#");
			for (var i = 0; i < pieces.length; i++) {
				if (old[pieces[i]]) {
          return true;
        }
			}
      return false;
		});
    // if (k == "S") {
    //   console.log("counter: " + counter)
    //   console.log("S: " + hasVals)
    // }
		// console.log(hasVals)
		if (hasVals.length != 0) {
			// console.log(hasVals)
			G[k] = hasVals
      if (hasVals.length != arr.length) {
        dirty = true;
      }
		} else {
			dirty = true;
			// remove self from map
			// ... by not doing anything?
		}
	})
  counter++;
	old = deepCopy(G)
	// console.log(old)
}
// console.log("counter: " + counter)
// console.log(Gprod["S"])
// console.log(old["S"]);

// console.log(old)
// console.log(cfg.edges())
// console.log(spec.edges())

// need to strip out #

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
console.log(Gprod)

// console.log(old["S"]);
// if (!old["S"]) {
//   console.log('spec is sound!!!!');
//   return;
// }
// console.log(replaceHashes(Gprod));
var g = new GrammarGraph(replaceHashes(Gprod))
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
  i++
}

if (out.length == 0) {
  console.log('could not find any counter examples by max depth ' + MAX_DEPTH);
}
if (out.length == 1) {
  console.log('found counter example ' + out[0] + ' at depth ' + i);
}
if (out.length > 1) {
  console.log('found counter examples ' + out + " at depth " + i);
}
