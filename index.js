// Stefan Dierauf
// Lab 2 automata and languages

// Deps
var Graph = require('graphlib').Graph;
var alg = require('graphlib').alg;
var fs = require('fs');
var prompt = require('prompt-sync')();
var GrammarGraph = require('grammar-graph'); 

// Steps:
// get input
var cfgFile = prompt('cfg? ');
cfgFile = 'lab2/Simple/simple.cfg';
var cfgContent = fs.readFileSync(cfgFile, 'ascii');

var specFile = prompt('spec? ');
specFile = 'lab2/Simple/simple.spec';
var specContent = fs.readFileSync(specFile, 'ascii');

// parse into graphs
console.log(cfgContent);
console.log(specContent);


// 1. Process an input file describing the flow graph FG, and store it in some
// suitable data structure.
var entryPoints = {};

var cfg = new Graph({multigraph: true});
cfgContent.split('\n').forEach(function(line) {
	if (line.length == 0) { return }
	var parts = line.split(' ');
	parts = parts.map(function (el) {return el.trim()});
	var type = parts[0];
	if (type == 'node') {
		var node = parts[1];
		var method = parts[2].match(/\([a-zA-Z0-9]+\)/g)[0].match(/[a-zA-Z0-9]+/g)[0];
		var ret = parts[3] == 'ret';
		if (!ret) {
			entryPoints[method] = node;
		}
		cfg.setNode(node, {name: node, method: method, entry: !ret});
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
	node = {name: parts[0].match(/[a-zA-Z0-9]+/g)[0], terminal: nodeIsFinal};
	spec.setNode(node.name, node);
	edge = parts[1].match(/[a-zA-Z0-9]+/g)[0];
	if (parts[2].indexOf('(') > -1) {
		destIsFinal = true;
	}
	dest = {name: parts[2].match(/[a-zA-Z0-9]+/g)[0], terminal: destIsFinal}
	spec.setNode(dest.name, dest);
	spec.setEdge(node.name, dest.name, edge, edge);
});

// 3. Compute the complement of the DFA (see page 135 of the course book).
var complementSpec = new Graph({multigraph: true});
cfg.nodes().forEach(function(node) {
	console.log(cfg.node(node))
});
console.log(spec.nodes())

spec.nodes().forEach(function(node) {
	var complementNode = spec.node(node);
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
	return "["  + s + " " + p + " " + e + "]"
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
	console.log(sym);
	Gprod["S"].push(sym);
})
console.log(Gprod);

// 2. For every transfer edge vi
// −→ vj of F and every state sequence qaqb ∈
// Q2
// , a production [qa vi qb] → [qa vj qb].


// 3. For every call edge vi
// m−→ vj and every state sequence qaqbqcqd ∈ Q4
// ,
// a production [qa vi qd] → [qa m qb][qb vk qc][qc vj qd], where vk is the
// entry node of method m.


// 4. For every return node vi ∈ R and every state qj ∈ Q, a production
// [qj vi qj ] → .
var retNodes = [];
cfg.nodes().forEach(function(n) {
	var node = cfg.node(n);
	if (!node.entry) {
		retNodes.push(node);
	}
});
complementSpec.nodes().forEach(function(n) {
	retNodes.forEach(function (ret) {
		var sym = symbol(n, ret, n);
		if (!Gprod[sym]) Gprod[sym] = [];
		Gprod[sym].push(sym);
	})
})

// 5. For every transition δ(qi
// , a) = qj of D, a production [qi a qj ] → a.



// 5. Test Gprod for lang




