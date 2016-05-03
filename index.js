// Stefan Dierauf
// Lab 2 automata and languages

// Deps
var Graph = require('graphlib').Graph;
var alg = require('graphlib').alg;
var fs = require('fs');
var prompt = require('prompt-sync')();

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

// parse CFG graph
var cfg = new Graph({multigraph: true});
cfgContent.split('\n').forEach(function(line) {
	if (line.length == 0) { return }
	var parts = line.split(' ');
	parts = parts.map(function (el) {return el.trim()});
	var type = parts[0];
	if (type == 'node') {
		var node = parts[1];
		var method = parts[2];
		var ret = parts[3] == 'ret';
		cfg.setNode(node, {name: node, method: method, entry: !ret});
	} else if (type == 'edge') {
		var node = parts[1];
		var dest = parts[2];
		var label = parts[3];
		cfg.setEdge(node, dest, label)
	} else {
		console.log('what is this line: ' + line);
	}
});


// parse Spec graph
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
	spec.setEdge(node.name, dest.name, edge);
});

// fold??




