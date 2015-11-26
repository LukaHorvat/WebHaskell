(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var slice = Array.prototype.slice

module.exports = iterativelyWalk

function iterativelyWalk(nodes, cb) {
    if (!('length' in nodes)) {
        nodes = [nodes]
    }
    
    nodes = slice.call(nodes)

    while(nodes.length) {
        var node = nodes.shift(),
            ret = cb(node)

        if (ret) {
            return ret
        }

        if (node.childNodes && node.childNodes.length) {
            nodes = slice.call(node.childNodes).concat(nodes)
        }
    }
}

},{}],2:[function(require,module,exports){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

},{"min-document":13}],3:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],4:[function(require,module,exports){
var domWalk = require("dom-walk")

var Comment = require("./dom-comment.js")
var DOMText = require("./dom-text.js")
var DOMElement = require("./dom-element.js")
var DocumentFragment = require("./dom-fragment.js")
var Event = require("./event.js")
var dispatchEvent = require("./event/dispatch-event.js")
var addEventListener = require("./event/add-event-listener.js")
var removeEventListener = require("./event/remove-event-listener.js")

module.exports = Document;

function Document() {
    if (!(this instanceof Document)) {
        return new Document();
    }

    this.head = this.createElement("head")
    this.body = this.createElement("body")
    this.documentElement = this.createElement("html")
    this.documentElement.appendChild(this.head)
    this.documentElement.appendChild(this.body)
    this.childNodes = [this.documentElement]
    this.nodeType = 9
}

var proto = Document.prototype;
proto.createTextNode = function createTextNode(value) {
    return new DOMText(value, this)
}

proto.createElementNS = function createElementNS(namespace, tagName) {
    var ns = namespace === null ? null : String(namespace)
    return new DOMElement(tagName, this, ns)
}

proto.createElement = function createElement(tagName) {
    return new DOMElement(tagName, this)
}

proto.createDocumentFragment = function createDocumentFragment() {
    return new DocumentFragment(this)
}

proto.createEvent = function createEvent(family) {
    return new Event(family)
}

proto.createComment = function createComment(data) {
    return new Comment(data, this)
}

proto.getElementById = function getElementById(id) {
    id = String(id)

    var result = domWalk(this.childNodes, function (node) {
        if (String(node.id) === id) {
            return node
        }
    })

    return result || null
}

proto.getElementsByClassName = DOMElement.prototype.getElementsByClassName
proto.getElementsByTagName = DOMElement.prototype.getElementsByTagName

proto.removeEventListener = removeEventListener
proto.addEventListener = addEventListener
proto.dispatchEvent = dispatchEvent

},{"./dom-comment.js":5,"./dom-element.js":6,"./dom-fragment.js":7,"./dom-text.js":8,"./event.js":9,"./event/add-event-listener.js":10,"./event/dispatch-event.js":11,"./event/remove-event-listener.js":12,"dom-walk":1}],5:[function(require,module,exports){
module.exports = Comment

function Comment(data, owner) {
    if (!(this instanceof Comment)) {
        return new Comment(data, owner)
    }

    this.data = data
    this.nodeValue = data
    this.length = data.length
    this.ownerDocument = owner || null
}

Comment.prototype.nodeType = 8
Comment.prototype.nodeName = "#comment"

Comment.prototype.toString = function _Comment_toString() {
    return "[object Comment]"
}

},{}],6:[function(require,module,exports){
var domWalk = require("dom-walk")
var dispatchEvent = require("./event/dispatch-event.js")
var addEventListener = require("./event/add-event-listener.js")
var removeEventListener = require("./event/remove-event-listener.js")
var serializeNode = require("./serialize.js")

var htmlns = "http://www.w3.org/1999/xhtml"

module.exports = DOMElement

function DOMElement(tagName, owner, namespace) {
    if (!(this instanceof DOMElement)) {
        return new DOMElement(tagName)
    }

    var ns = namespace === undefined ? htmlns : (namespace || null)

    this.tagName = ns === htmlns ? String(tagName).toUpperCase() : tagName
    this.className = ""
    this.dataset = {}
    this.childNodes = []
    this.parentNode = null
    this.style = {}
    this.ownerDocument = owner || null
    this.namespaceURI = ns
    this._attributes = {}

    if (this.tagName === 'INPUT') {
      this.type = 'text'
    }
}

DOMElement.prototype.type = "DOMElement"
DOMElement.prototype.nodeType = 1

DOMElement.prototype.appendChild = function _Element_appendChild(child) {
    if (child.parentNode) {
        child.parentNode.removeChild(child)
    }

    this.childNodes.push(child)
    child.parentNode = this

    return child
}

DOMElement.prototype.replaceChild =
    function _Element_replaceChild(elem, needle) {
        // TODO: Throw NotFoundError if needle.parentNode !== this

        if (elem.parentNode) {
            elem.parentNode.removeChild(elem)
        }

        var index = this.childNodes.indexOf(needle)

        needle.parentNode = null
        this.childNodes[index] = elem
        elem.parentNode = this

        return needle
    }

DOMElement.prototype.removeChild = function _Element_removeChild(elem) {
    // TODO: Throw NotFoundError if elem.parentNode !== this

    var index = this.childNodes.indexOf(elem)
    this.childNodes.splice(index, 1)

    elem.parentNode = null
    return elem
}

DOMElement.prototype.insertBefore =
    function _Element_insertBefore(elem, needle) {
        // TODO: Throw NotFoundError if referenceElement is a dom node
        // and parentNode !== this

        if (elem.parentNode) {
            elem.parentNode.removeChild(elem)
        }

        var index = needle === null || needle === undefined ?
            -1 :
            this.childNodes.indexOf(needle)

        if (index > -1) {
            this.childNodes.splice(index, 0, elem)
        } else {
            this.childNodes.push(elem)
        }

        elem.parentNode = this
        return elem
    }

DOMElement.prototype.setAttributeNS =
    function _Element_setAttributeNS(namespace, name, value) {
        var colonPosition = name.indexOf(":")
        var localName = colonPosition > -1 ? name.substr(colonPosition + 1) : name
        var attributes = this._attributes[namespace] || (this._attributes[namespace] = {})
        attributes[localName] = value
    }

DOMElement.prototype.getAttributeNS =
    function _Element_getAttributeNS(namespace, name) {
        var attributes = this._attributes[namespace];
        if (!(attributes && typeof attributes[name] === "string")) {
            return null
        }

        return attributes[name]
    }

DOMElement.prototype.removeAttributeNS =
    function _Element_removeAttributeNS(namespace, name) {
        var attributes = this._attributes[namespace];
        if (attributes) {
            delete attributes[name]
        }
    }

DOMElement.prototype.hasAttributeNS =
    function _Element_hasAttributeNS(namespace, name) {
        var attributes = this._attributes[namespace]
        return !!attributes && name in attributes;
    }

DOMElement.prototype.setAttribute = function _Element_setAttribute(name, value) {
    return this.setAttributeNS(null, name, value)
}

DOMElement.prototype.getAttribute = function _Element_getAttribute(name) {
    return this.getAttributeNS(null, name)
}

DOMElement.prototype.removeAttribute = function _Element_removeAttribute(name) {
    return this.removeAttributeNS(null, name)
}

DOMElement.prototype.hasAttribute = function _Element_hasAttribute(name) {
    return this.hasAttributeNS(null, name)
}

DOMElement.prototype.removeEventListener = removeEventListener
DOMElement.prototype.addEventListener = addEventListener
DOMElement.prototype.dispatchEvent = dispatchEvent

// Un-implemented
DOMElement.prototype.focus = function _Element_focus() {
    return void 0
}

DOMElement.prototype.toString = function _Element_toString() {
    return serializeNode(this)
}

DOMElement.prototype.getElementsByClassName = function _Element_getElementsByClassName(classNames) {
    var classes = classNames.split(" ");
    var elems = []

    domWalk(this, function (node) {
        if (node.nodeType === 1) {
            var nodeClassName = node.className || ""
            var nodeClasses = nodeClassName.split(" ")

            if (classes.every(function (item) {
                return nodeClasses.indexOf(item) !== -1
            })) {
                elems.push(node)
            }
        }
    })

    return elems
}

DOMElement.prototype.getElementsByTagName = function _Element_getElementsByTagName(tagName) {
    tagName = tagName.toLowerCase()
    var elems = []

    domWalk(this.childNodes, function (node) {
        if (node.nodeType === 1 && (tagName === '*' || node.tagName.toLowerCase() === tagName)) {
            elems.push(node)
        }
    })

    return elems
}

},{"./event/add-event-listener.js":10,"./event/dispatch-event.js":11,"./event/remove-event-listener.js":12,"./serialize.js":14,"dom-walk":1}],7:[function(require,module,exports){
var DOMElement = require("./dom-element.js")

module.exports = DocumentFragment

function DocumentFragment(owner) {
    if (!(this instanceof DocumentFragment)) {
        return new DocumentFragment()
    }

    this.childNodes = []
    this.parentNode = null
    this.ownerDocument = owner || null
}

DocumentFragment.prototype.type = "DocumentFragment"
DocumentFragment.prototype.nodeType = 11
DocumentFragment.prototype.nodeName = "#document-fragment"

DocumentFragment.prototype.appendChild  = DOMElement.prototype.appendChild
DocumentFragment.prototype.replaceChild = DOMElement.prototype.replaceChild
DocumentFragment.prototype.removeChild  = DOMElement.prototype.removeChild

DocumentFragment.prototype.toString =
    function _DocumentFragment_toString() {
        return this.childNodes.map(function (node) {
            return String(node)
        }).join("")
    }

},{"./dom-element.js":6}],8:[function(require,module,exports){
module.exports = DOMText

function DOMText(value, owner) {
    if (!(this instanceof DOMText)) {
        return new DOMText(value)
    }

    this.data = value || ""
    this.length = this.data.length
    this.ownerDocument = owner || null
}

DOMText.prototype.type = "DOMTextNode"
DOMText.prototype.nodeType = 3

DOMText.prototype.toString = function _Text_toString() {
    return this.data
}

DOMText.prototype.replaceData = function replaceData(index, length, value) {
    var current = this.data
    var left = current.substring(0, index)
    var right = current.substring(index + length, current.length)
    this.data = left + value + right
    this.length = this.data.length
}

},{}],9:[function(require,module,exports){
module.exports = Event

function Event(family) {}

Event.prototype.initEvent = function _Event_initEvent(type, bubbles, cancelable) {
    this.type = type
    this.bubbles = bubbles
    this.cancelable = cancelable
}

Event.prototype.preventDefault = function _Event_preventDefault() {
    
}

},{}],10:[function(require,module,exports){
module.exports = addEventListener

function addEventListener(type, listener) {
    var elem = this

    if (!elem.listeners) {
        elem.listeners = {}
    }

    if (!elem.listeners[type]) {
        elem.listeners[type] = []
    }

    if (elem.listeners[type].indexOf(listener) === -1) {
        elem.listeners[type].push(listener)
    }
}

},{}],11:[function(require,module,exports){
module.exports = dispatchEvent

function dispatchEvent(ev) {
    var elem = this
    var type = ev.type

    if (!ev.target) {
        ev.target = elem
    }

    if (!elem.listeners) {
        elem.listeners = {}
    }

    var listeners = elem.listeners[type]

    if (listeners) {
        return listeners.forEach(function (listener) {
            ev.currentTarget = elem
            if (typeof listener === 'function') {
                listener(ev)
            } else {
                listener.handleEvent(ev)
            }
        })
    }

    if (elem.parentNode) {
        elem.parentNode.dispatchEvent(ev)
    }
}

},{}],12:[function(require,module,exports){
module.exports = removeEventListener

function removeEventListener(type, listener) {
    var elem = this

    if (!elem.listeners) {
        return
    }

    if (!elem.listeners[type]) {
        return
    }

    var list = elem.listeners[type]
    var index = list.indexOf(listener)
    if (index !== -1) {
        list.splice(index, 1)
    }
}

},{}],13:[function(require,module,exports){
var Document = require('./document.js');

module.exports = new Document();

},{"./document.js":4}],14:[function(require,module,exports){
module.exports = serializeNode

var voidElements = /area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr/i;

function serializeNode(node) {
    switch (node.nodeType) {
        case 3:
            return escapeText(node.data)
        case 8:
            return "<!--" + node.data + "-->"
        default:
            return serializeElement(node)
    }
}

function serializeElement(elem) {
    var strings = []

    var tagname = elem.tagName

    if (elem.namespaceURI === "http://www.w3.org/1999/xhtml") {
        tagname = tagname.toLowerCase()
    }

    strings.push("<" + tagname + properties(elem) + datasetify(elem))

    if (voidElements.test(tagname)) {
        strings.push(" />")
    } else {
        strings.push(">")

        if (elem.childNodes.length) {
            strings.push.apply(strings, elem.childNodes.map(serializeNode))
        } else if (elem.textContent || elem.innerText) {
            strings.push(escapeText(elem.textContent || elem.innerText))
        }

        strings.push("</" + tagname + ">")
    }

    return strings.join("")
}

function isProperty(elem, key) {
    var type = typeof elem[key]

    if (key === "style" && Object.keys(elem.style).length > 0) {
      return true
    }

    return elem.hasOwnProperty(key) &&
        (type === "string" || type === "boolean" || type === "number") &&
        key !== "nodeName" && key !== "className" && key !== "tagName" &&
        key !== "textContent" && key !== "innerText" && key !== "namespaceURI"
}

function stylify(styles) {
    var attr = ""
    Object.keys(styles).forEach(function (key) {
        var value = styles[key]
        attr += key + ":" + value + ";"
    })
    return attr
}

function datasetify(elem) {
    var ds = elem.dataset
    var props = []

    for (var key in ds) {
        props.push({ name: "data-" + key, value: ds[key] })
    }

    return props.length ? stringify(props) : ""
}

function stringify(list) {
    var attributes = []
    list.forEach(function (tuple) {
        var name = tuple.name
        var value = tuple.value

        if (name === "style") {
            value = stylify(value)
        }

        attributes.push(name + "=" + "\"" + escapeAttributeValue(value) + "\"")
    })

    return attributes.length ? " " + attributes.join(" ") : ""
}

function properties(elem) {
    var props = []
    for (var key in elem) {
        if (isProperty(elem, key)) {
            props.push({ name: key, value: elem[key] })
        }
    }

    for (var ns in elem._attributes) {
      for (var attribute in elem._attributes[ns]) {
        var name = (ns !== "null" ? ns + ":" : "") + attribute
        props.push({ name: name, value: elem._attributes[ns][attribute] })
      }
    }

    if (elem.className) {
        props.push({ name: "class", value: elem.className })
    }

    return props.length ? stringify(props) : ""
}

function escapeText(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function escapeAttributeValue(str) {
    return escapeText(str).replace(/"/g, "&quot;")
}

},{}],15:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":19}],16:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":36}],17:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":22}],18:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":27,"is-object":3}],19:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":25,"../vnode/is-vnode.js":28,"../vnode/is-vtext.js":29,"../vnode/is-widget.js":30,"./apply-properties":18,"global/document":2}],20:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],21:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":30,"../vnode/vpatch.js":33,"./apply-properties":18,"./update-widget":23}],22:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":19,"./dom-index":20,"./patch-op":21,"global/document":2,"x-is-array":37}],23:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":30}],24:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],25:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":26,"./is-vnode":28,"./is-vtext":29,"./is-widget":30}],26:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],27:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],28:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":31}],29:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":31}],30:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],31:[function(require,module,exports){
module.exports = "2"

},{}],32:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":26,"./is-vhook":27,"./is-vnode":28,"./is-widget":30,"./version":31}],33:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":31}],34:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":31}],35:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":27,"is-object":3}],36:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":25,"../vnode/is-thunk":26,"../vnode/is-vnode":28,"../vnode/is-vtext":29,"../vnode/is-widget":30,"../vnode/vpatch":33,"./diff-props":35,"x-is-array":37}],37:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],38:[function(require,module,exports){
// Generated by psc-bundle 0.7.6.1
var PS = { };
(function(exports) {
  /* global exports */
  "use strict";

  // module Prelude

  //- Functor --------------------------------------------------------------------

  exports.arrayMap = function (f) {
    return function (arr) {
      var l = arr.length;
      var result = new Array(l);
      for (var i = 0; i < l; i++) {
        result[i] = f(arr[i]);
      }
      return result;
    };
  };

  exports.concatArray = function (xs) {
    return function (ys) {
      return xs.concat(ys);
    };
  };

  //- Eq -------------------------------------------------------------------------

  exports.refEq = function (r1) {
    return function (r2) {
      return r1 === r2;
    };
  };

  //- Show -----------------------------------------------------------------------

  exports.showIntImpl = function (n) {
    return n.toString();
  };

  exports.showStringImpl = function (s) {
    return JSON.stringify(s);
  };
 
})(PS["Prelude"] = PS["Prelude"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Prelude"];
  var LT = (function () {
      function LT() {

      };
      LT.value = new LT();
      return LT;
  })();
  var GT = (function () {
      function GT() {

      };
      GT.value = new GT();
      return GT;
  })();
  var Semigroupoid = function (compose) {
      this.compose = compose;
  };
  var Category = function (__superclass_Prelude$dotSemigroupoid_0, id) {
      this["__superclass_Prelude.Semigroupoid_0"] = __superclass_Prelude$dotSemigroupoid_0;
      this.id = id;
  };
  var Functor = function (map) {
      this.map = map;
  };
  var Apply = function (__superclass_Prelude$dotFunctor_0, apply) {
      this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
      this.apply = apply;
  };
  var Applicative = function (__superclass_Prelude$dotApply_0, pure) {
      this["__superclass_Prelude.Apply_0"] = __superclass_Prelude$dotApply_0;
      this.pure = pure;
  };
  var Bind = function (__superclass_Prelude$dotApply_0, bind) {
      this["__superclass_Prelude.Apply_0"] = __superclass_Prelude$dotApply_0;
      this.bind = bind;
  };
  var Monad = function (__superclass_Prelude$dotApplicative_0, __superclass_Prelude$dotBind_1) {
      this["__superclass_Prelude.Applicative_0"] = __superclass_Prelude$dotApplicative_0;
      this["__superclass_Prelude.Bind_1"] = __superclass_Prelude$dotBind_1;
  };
  var Semigroup = function (append) {
      this.append = append;
  };
  var Eq = function (eq) {
      this.eq = eq;
  };
  var Show = function (show) {
      this.show = show;
  };                                                                           
  var unit = {};
  var showString = new Show($foreign.showStringImpl);
  var showInt = new Show($foreign.showIntImpl);
  var show = function (dict) {
      return dict.show;
  };                                                                     
  var semigroupoidFn = new Semigroupoid(function (f) {
      return function (g) {
          return function (x) {
              return f(g(x));
          };
      };
  });
  var semigroupArray = new Semigroup($foreign.concatArray);
  var pure = function (dict) {
      return dict.pure;
  };
  var $$return = function (__dict_Applicative_2) {
      return pure(__dict_Applicative_2);
  };
  var otherwise = true;
  var map = function (dict) {
      return dict.map;
  };
  var $less$dollar$greater = function (__dict_Functor_5) {
      return map(__dict_Functor_5);
  };
  var id = function (dict) {
      return dict.id;
  };
  var functorArray = new Functor($foreign.arrayMap);
  var flip = function (f) {
      return function (b) {
          return function (a) {
              return f(a)(b);
          };
      };
  }; 
  var eqString = new Eq($foreign.refEq);
  var eq = function (dict) {
      return dict.eq;
  };
  var $eq$eq = function (__dict_Eq_7) {
      return eq(__dict_Eq_7);
  };
  var $$const = function (a) {
      return function (_3) {
          return a;
      };
  };
  var $$void = function (__dict_Functor_12) {
      return function (fa) {
          return $less$dollar$greater(__dict_Functor_12)($$const(unit))(fa);
      };
  };
  var compose = function (dict) {
      return dict.compose;
  };
  var $greater$greater$greater = function (__dict_Semigroupoid_15) {
      return flip(compose(__dict_Semigroupoid_15));
  };
  var compare = function (dict) {
      return dict.compare;
  };
  var $less = function (__dict_Ord_17) {
      return function (a1) {
          return function (a2) {
              var _47 = compare(__dict_Ord_17)(a1)(a2);
              if (_47 instanceof LT) {
                  return true;
              };
              return false;
          };
      };
  };
  var $less$eq = function (__dict_Ord_18) {
      return function (a1) {
          return function (a2) {
              var _48 = compare(__dict_Ord_18)(a1)(a2);
              if (_48 instanceof GT) {
                  return false;
              };
              return true;
          };
      };
  };
  var categoryFn = new Category(function () {
      return semigroupoidFn;
  }, function (x) {
      return x;
  });
  var bind = function (dict) {
      return dict.bind;
  };
  var liftM1 = function (__dict_Monad_23) {
      return function (f) {
          return function (a) {
              return bind(__dict_Monad_23["__superclass_Prelude.Bind_1"]())(a)(function (_0) {
                  return $$return(__dict_Monad_23["__superclass_Prelude.Applicative_0"]())(f(_0));
              });
          };
      };
  };
  var $greater$greater$eq = function (__dict_Bind_24) {
      return bind(__dict_Bind_24);
  }; 
  var apply = function (dict) {
      return dict.apply;
  };
  var $less$times$greater = function (__dict_Apply_25) {
      return apply(__dict_Apply_25);
  };
  var liftA1 = function (__dict_Applicative_26) {
      return function (f) {
          return function (a) {
              return $less$times$greater(__dict_Applicative_26["__superclass_Prelude.Apply_0"]())(pure(__dict_Applicative_26)(f))(a);
          };
      };
  }; 
  var append = function (dict) {
      return dict.append;
  };
  var $plus$plus = function (__dict_Semigroup_27) {
      return append(__dict_Semigroup_27);
  };
  var $less$greater = function (__dict_Semigroup_28) {
      return append(__dict_Semigroup_28);
  };
  var ap = function (__dict_Monad_30) {
      return function (f) {
          return function (a) {
              return bind(__dict_Monad_30["__superclass_Prelude.Bind_1"]())(f)(function (_2) {
                  return bind(__dict_Monad_30["__superclass_Prelude.Bind_1"]())(a)(function (_1) {
                      return $$return(__dict_Monad_30["__superclass_Prelude.Applicative_0"]())(_2(_1));
                  });
              });
          };
      };
  };
  exports["LT"] = LT;
  exports["GT"] = GT;
  exports["Show"] = Show;
  exports["Eq"] = Eq;
  exports["Semigroup"] = Semigroup;
  exports["Monad"] = Monad;
  exports["Bind"] = Bind;
  exports["Applicative"] = Applicative;
  exports["Apply"] = Apply;
  exports["Functor"] = Functor;
  exports["Category"] = Category;
  exports["Semigroupoid"] = Semigroupoid;
  exports["show"] = show;
  exports["<="] = $less$eq;
  exports["<"] = $less;
  exports["compare"] = compare;
  exports["=="] = $eq$eq;
  exports["eq"] = eq;
  exports["++"] = $plus$plus;
  exports["<>"] = $less$greater;
  exports["append"] = append;
  exports["ap"] = ap;
  exports["liftM1"] = liftM1;
  exports["return"] = $$return;
  exports[">>="] = $greater$greater$eq;
  exports["bind"] = bind;
  exports["liftA1"] = liftA1;
  exports["pure"] = pure;
  exports["<*>"] = $less$times$greater;
  exports["apply"] = apply;
  exports["void"] = $$void;
  exports["<$>"] = $less$dollar$greater;
  exports["map"] = map;
  exports["id"] = id;
  exports[">>>"] = $greater$greater$greater;
  exports["compose"] = compose;
  exports["otherwise"] = otherwise;
  exports["const"] = $$const;
  exports["flip"] = flip;
  exports["unit"] = unit;
  exports["semigroupoidFn"] = semigroupoidFn;
  exports["categoryFn"] = categoryFn;
  exports["functorArray"] = functorArray;
  exports["semigroupArray"] = semigroupArray;
  exports["eqString"] = eqString;
  exports["showInt"] = showInt;
  exports["showString"] = showString;;
 
})(PS["Prelude"] = PS["Prelude"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var Alt = function (__superclass_Prelude$dotFunctor_0, alt) {
      this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
      this.alt = alt;
  };                                         
  var alt = function (dict) {
      return dict.alt;
  };
  var $less$bar$greater = function (__dict_Alt_0) {
      return alt(__dict_Alt_0);
  };
  exports["Alt"] = Alt;
  exports["<|>"] = $less$bar$greater;
  exports["alt"] = alt;;
 
})(PS["Control.Alt"] = PS["Control.Alt"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var $times$greater = function (__dict_Apply_1) {
      return function (a) {
          return function (b) {
              return Prelude["<*>"](__dict_Apply_1)(Prelude["<$>"](__dict_Apply_1["__superclass_Prelude.Functor_0"]())(Prelude["const"](Prelude.id(Prelude.categoryFn)))(a))(b);
          };
      };
  };
  exports["*>"] = $times$greater;;
 
})(PS["Control.Apply"] = PS["Control.Apply"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var $eq$less$less = function (__dict_Bind_1) {
      return function (f) {
          return function (m) {
              return Prelude[">>="](__dict_Bind_1)(m)(f);
          };
      };
  };
  var $less$eq$less = function (__dict_Bind_2) {
      return function (f) {
          return function (g) {
              return function (a) {
                  return $eq$less$less(__dict_Bind_2)(f)(g(a));
              };
          };
      };
  };
  exports["<=<"] = $less$eq$less;
  exports["=<<"] = $eq$less$less;;
 
})(PS["Control.Bind"] = PS["Control.Bind"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];     
  var Plus = function (__superclass_Control$dotAlt$dotAlt_0, empty) {
      this["__superclass_Control.Alt.Alt_0"] = __superclass_Control$dotAlt$dotAlt_0;
      this.empty = empty;
  };       
  var empty = function (dict) {
      return dict.empty;
  };
  exports["Plus"] = Plus;
  exports["empty"] = empty;;
 
})(PS["Control.Plus"] = PS["Control.Plus"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var Monoid = function (__superclass_Prelude$dotSemigroup_0, mempty) {
      this["__superclass_Prelude.Semigroup_0"] = __superclass_Prelude$dotSemigroup_0;
      this.mempty = mempty;
  };     
  var monoidArray = new Monoid(function () {
      return Prelude.semigroupArray;
  }, [  ]);
  var mempty = function (dict) {
      return dict.mempty;
  };
  exports["Monoid"] = Monoid;
  exports["mempty"] = mempty;
  exports["monoidArray"] = monoidArray;;
 
})(PS["Data.Monoid"] = PS["Data.Monoid"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Extend = PS["Control.Extend"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Functor_Invariant = PS["Data.Functor.Invariant"];
  var Data_Monoid = PS["Data.Monoid"];     
  var Nothing = (function () {
      function Nothing() {

      };
      Nothing.value = new Nothing();
      return Nothing;
  })();
  var Just = (function () {
      function Just(value0) {
          this.value0 = value0;
      };
      Just.create = function (value0) {
          return new Just(value0);
      };
      return Just;
  })();
  var maybe = function (b) {
      return function (f) {
          return function (_0) {
              if (_0 instanceof Nothing) {
                  return b;
              };
              if (_0 instanceof Just) {
                  return f(_0.value0);
              };
              throw new Error("Failed pattern match at Data.Maybe line 26, column 1 - line 27, column 1: " + [ b.constructor.name, f.constructor.name, _0.constructor.name ]);
          };
      };
  };                                                
  var functorMaybe = new Prelude.Functor(function (fn) {
      return function (_2) {
          if (_2 instanceof Just) {
              return new Just(fn(_2.value0));
          };
          return Nothing.value;
      };
  });
  exports["Nothing"] = Nothing;
  exports["Just"] = Just;
  exports["maybe"] = maybe;
  exports["functorMaybe"] = functorMaybe;;
 
})(PS["Data.Maybe"] = PS["Data.Maybe"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var Bifunctor = function (bimap) {
      this.bimap = bimap;
  };
  var bimap = function (dict) {
      return dict.bimap;
  };
  var rmap = function (__dict_Bifunctor_1) {
      return bimap(__dict_Bifunctor_1)(Prelude.id(Prelude.categoryFn));
  };
  exports["Bifunctor"] = Bifunctor;
  exports["rmap"] = rmap;
  exports["bimap"] = bimap;;
 
})(PS["Data.Bifunctor"] = PS["Data.Bifunctor"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Foldable

  exports.foldrArray = function (f) {
    return function (init) {
      return function (xs) {
        var acc = init;
        var len = xs.length;
        for (var i = len - 1; i >= 0; i--) {
          acc = f(xs[i])(acc);
        }
        return acc;
      };
    };
  };

  exports.foldlArray = function (f) {
    return function (init) {
      return function (xs) {
        var acc = init;
        var len = xs.length;
        for (var i = 0; i < len; i++) {
          acc = f(acc)(xs[i]);
        }
        return acc;
      };
    };
  };
 
})(PS["Data.Foldable"] = PS["Data.Foldable"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Foldable"];
  var Prelude = PS["Prelude"];
  var Control_Apply = PS["Control.Apply"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_First = PS["Data.Maybe.First"];
  var Data_Maybe_Last = PS["Data.Maybe.Last"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Monoid_Additive = PS["Data.Monoid.Additive"];
  var Data_Monoid_Conj = PS["Data.Monoid.Conj"];
  var Data_Monoid_Disj = PS["Data.Monoid.Disj"];
  var Data_Monoid_Dual = PS["Data.Monoid.Dual"];
  var Data_Monoid_Endo = PS["Data.Monoid.Endo"];
  var Data_Monoid_Multiplicative = PS["Data.Monoid.Multiplicative"];     
  var Foldable = function (foldMap, foldl, foldr) {
      this.foldMap = foldMap;
      this.foldl = foldl;
      this.foldr = foldr;
  };
  var foldr = function (dict) {
      return dict.foldr;
  };
  var traverse_ = function (__dict_Applicative_0) {
      return function (__dict_Foldable_1) {
          return function (f) {
              return foldr(__dict_Foldable_1)(function (_97) {
                  return Control_Apply["*>"](__dict_Applicative_0["__superclass_Prelude.Apply_0"]())(f(_97));
              })(Prelude.pure(__dict_Applicative_0)(Prelude.unit));
          };
      };
  };
  var for_ = function (__dict_Applicative_2) {
      return function (__dict_Foldable_3) {
          return Prelude.flip(traverse_(__dict_Applicative_2)(__dict_Foldable_3));
      };
  };
  var foldl = function (dict) {
      return dict.foldl;
  }; 
  var foldableMaybe = new Foldable(function (__dict_Monoid_15) {
      return function (f) {
          return function (_2) {
              if (_2 instanceof Data_Maybe.Nothing) {
                  return Data_Monoid.mempty(__dict_Monoid_15);
              };
              if (_2 instanceof Data_Maybe.Just) {
                  return f(_2.value0);
              };
              throw new Error("Failed pattern match at Data.Foldable line 99, column 1 - line 107, column 1: " + [ f.constructor.name, _2.constructor.name ]);
          };
      };
  }, function (f) {
      return function (z) {
          return function (_1) {
              if (_1 instanceof Data_Maybe.Nothing) {
                  return z;
              };
              if (_1 instanceof Data_Maybe.Just) {
                  return f(z)(_1.value0);
              };
              throw new Error("Failed pattern match at Data.Foldable line 99, column 1 - line 107, column 1: " + [ f.constructor.name, z.constructor.name, _1.constructor.name ]);
          };
      };
  }, function (f) {
      return function (z) {
          return function (_0) {
              if (_0 instanceof Data_Maybe.Nothing) {
                  return z;
              };
              if (_0 instanceof Data_Maybe.Just) {
                  return f(_0.value0)(z);
              };
              throw new Error("Failed pattern match at Data.Foldable line 99, column 1 - line 107, column 1: " + [ f.constructor.name, z.constructor.name, _0.constructor.name ]);
          };
      };
  });
  var foldMapDefaultR = function (__dict_Foldable_20) {
      return function (__dict_Monoid_21) {
          return function (f) {
              return function (xs) {
                  return foldr(__dict_Foldable_20)(function (x) {
                      return function (acc) {
                          return Prelude["<>"](__dict_Monoid_21["__superclass_Prelude.Semigroup_0"]())(f(x))(acc);
                      };
                  })(Data_Monoid.mempty(__dict_Monoid_21))(xs);
              };
          };
      };
  };
  var foldableArray = new Foldable(function (__dict_Monoid_22) {
      return foldMapDefaultR(foldableArray)(__dict_Monoid_22);
  }, $foreign.foldlArray, $foreign.foldrArray);
  var foldMap = function (dict) {
      return dict.foldMap;
  };
  exports["Foldable"] = Foldable;
  exports["for_"] = for_;
  exports["traverse_"] = traverse_;
  exports["foldMapDefaultR"] = foldMapDefaultR;
  exports["foldMap"] = foldMap;
  exports["foldl"] = foldl;
  exports["foldr"] = foldr;
  exports["foldableArray"] = foldableArray;
  exports["foldableMaybe"] = foldableMaybe;;
 
})(PS["Data.Foldable"] = PS["Data.Foldable"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Traversable

  // jshint maxparams: 3

  exports.traverseArrayImpl = function () {
    function Cont (fn) {
      this.fn = fn;
    }

    var emptyList = {};

    var ConsCell = function (head, tail) {
      this.head = head;
      this.tail = tail;
    };

    function consList (x) {
      return function (xs) {
        return new ConsCell(x, xs);
      };
    }

    function listToArray (list) {
      var arr = [];
      while (list !== emptyList) {
        arr.push(list.head);
        list = list.tail;
      }
      return arr;
    }

    return function (apply) {
      return function (map) {
        return function (pure) {
          return function (f) {
            var buildFrom = function (x, ys) {
              return apply(map(consList)(f(x)))(ys);
            };

            var go = function (acc, currentLen, xs) {
              if (currentLen === 0) {
                return acc;
              } else {
                var last = xs[currentLen - 1];
                return new Cont(function () {
                  return go(buildFrom(last, acc), currentLen - 1, xs);
                });
              }
            };

            return function (array) {
              var result = go(pure(emptyList), array.length, array);
              while (result instanceof Cont) {
                result = result.fn();
              }

              return map(listToArray)(result);
            };
          };
        };
      };
    };
  }();
 
})(PS["Data.Traversable"] = PS["Data.Traversable"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Traversable"];
  var Prelude = PS["Prelude"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_First = PS["Data.Maybe.First"];
  var Data_Maybe_Last = PS["Data.Maybe.Last"];
  var Data_Monoid_Additive = PS["Data.Monoid.Additive"];
  var Data_Monoid_Conj = PS["Data.Monoid.Conj"];
  var Data_Monoid_Disj = PS["Data.Monoid.Disj"];
  var Data_Monoid_Dual = PS["Data.Monoid.Dual"];
  var Data_Monoid_Multiplicative = PS["Data.Monoid.Multiplicative"];
  var Traversable = function (__superclass_Data$dotFoldable$dotFoldable_1, __superclass_Prelude$dotFunctor_0, sequence, traverse) {
      this["__superclass_Data.Foldable.Foldable_1"] = __superclass_Data$dotFoldable$dotFoldable_1;
      this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
      this.sequence = sequence;
      this.traverse = traverse;
  };
  var traverse = function (dict) {
      return dict.traverse;
  };
  var sequenceDefault = function (__dict_Traversable_12) {
      return function (__dict_Applicative_13) {
          return function (tma) {
              return traverse(__dict_Traversable_12)(__dict_Applicative_13)(Prelude.id(Prelude.categoryFn))(tma);
          };
      };
  };
  var traversableArray = new Traversable(function () {
      return Data_Foldable.foldableArray;
  }, function () {
      return Prelude.functorArray;
  }, function (__dict_Applicative_15) {
      return sequenceDefault(traversableArray)(__dict_Applicative_15);
  }, function (__dict_Applicative_14) {
      return $foreign.traverseArrayImpl(Prelude.apply(__dict_Applicative_14["__superclass_Prelude.Apply_0"]()))(Prelude.map((__dict_Applicative_14["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]()))(Prelude.pure(__dict_Applicative_14));
  });
  var sequence = function (dict) {
      return dict.sequence;
  };
  exports["Traversable"] = Traversable;
  exports["sequenceDefault"] = sequenceDefault;
  exports["sequence"] = sequence;
  exports["traverse"] = traverse;
  exports["traversableArray"] = traversableArray;;
 
})(PS["Data.Traversable"] = PS["Data.Traversable"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Biapplicative = PS["Control.Biapplicative"];
  var Control_Biapply = PS["Control.Biapply"];
  var Control_Comonad = PS["Control.Comonad"];
  var Control_Extend = PS["Control.Extend"];
  var Control_Lazy = PS["Control.Lazy"];
  var Data_Bifoldable = PS["Data.Bifoldable"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Bitraversable = PS["Data.Bitraversable"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Functor_Invariant = PS["Data.Functor.Invariant"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_First = PS["Data.Maybe.First"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];     
  var Tuple = (function () {
      function Tuple(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Tuple.create = function (value0) {
          return function (value1) {
              return new Tuple(value0, value1);
          };
      };
      return Tuple;
  })();
  exports["Tuple"] = Tuple;;
 
})(PS["Data.Tuple"] = PS["Data.Tuple"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Extend = PS["Control.Extend"];
  var Data_Bifoldable = PS["Data.Bifoldable"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Bitraversable = PS["Data.Bitraversable"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];     
  var Left = (function () {
      function Left(value0) {
          this.value0 = value0;
      };
      Left.create = function (value0) {
          return new Left(value0);
      };
      return Left;
  })();
  var Right = (function () {
      function Right(value0) {
          this.value0 = value0;
      };
      Right.create = function (value0) {
          return new Right(value0);
      };
      return Right;
  })();
  var functorEither = new Prelude.Functor(function (f) {
      return function (_2) {
          if (_2 instanceof Left) {
              return new Left(_2.value0);
          };
          if (_2 instanceof Right) {
              return new Right(f(_2.value0));
          };
          throw new Error("Failed pattern match at Data.Either line 52, column 1 - line 56, column 1: " + [ f.constructor.name, _2.constructor.name ]);
      };
  });
  var either = function (f) {
      return function (g) {
          return function (_1) {
              if (_1 instanceof Left) {
                  return f(_1.value0);
              };
              if (_1 instanceof Right) {
                  return g(_1.value0);
              };
              throw new Error("Failed pattern match at Data.Either line 28, column 1 - line 29, column 1: " + [ f.constructor.name, g.constructor.name, _1.constructor.name ]);
          };
      };
  };
  var bifunctorEither = new Data_Bifunctor.Bifunctor(function (f) {
      return function (g) {
          return function (_3) {
              if (_3 instanceof Left) {
                  return new Left(f(_3.value0));
              };
              if (_3 instanceof Right) {
                  return new Right(g(_3.value0));
              };
              throw new Error("Failed pattern match at Data.Either line 56, column 1 - line 92, column 1: " + [ f.constructor.name, g.constructor.name, _3.constructor.name ]);
          };
      };
  });
  var applyEither = new Prelude.Apply(function () {
      return functorEither;
  }, function (_4) {
      return function (r) {
          if (_4 instanceof Left) {
              return new Left(_4.value0);
          };
          if (_4 instanceof Right) {
              return Prelude["<$>"](functorEither)(_4.value0)(r);
          };
          throw new Error("Failed pattern match at Data.Either line 92, column 1 - line 116, column 1: " + [ _4.constructor.name, r.constructor.name ]);
      };
  });
  var bindEither = new Prelude.Bind(function () {
      return applyEither;
  }, either(function (e) {
      return function (_0) {
          return new Left(e);
      };
  })(function (a) {
      return function (f) {
          return f(a);
      };
  }));
  var applicativeEither = new Prelude.Applicative(function () {
      return applyEither;
  }, Right.create);
  var altEither = new Control_Alt.Alt(function () {
      return functorEither;
  }, function (_5) {
      return function (r) {
          if (_5 instanceof Left) {
              return r;
          };
          return _5;
      };
  });
  exports["Left"] = Left;
  exports["Right"] = Right;
  exports["either"] = either;
  exports["functorEither"] = functorEither;
  exports["bifunctorEither"] = bifunctorEither;
  exports["applyEither"] = applyEither;
  exports["applicativeEither"] = applicativeEither;
  exports["altEither"] = altEither;
  exports["bindEither"] = bindEither;;
 
})(PS["Data.Either"] = PS["Data.Either"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Comonad = PS["Control.Comonad"];
  var Control_Extend = PS["Control.Extend"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Functor_Invariant = PS["Data.Functor.Invariant"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];     
  var Identity = function (x) {
      return x;
  };
  var runIdentity = function (_0) {
      return _0;
  };
  var functorIdentity = new Prelude.Functor(function (f) {
      return function (_23) {
          return f(_23);
      };
  });
  var applyIdentity = new Prelude.Apply(function () {
      return functorIdentity;
  }, function (_24) {
      return function (_25) {
          return _24(_25);
      };
  });
  var bindIdentity = new Prelude.Bind(function () {
      return applyIdentity;
  }, function (_26) {
      return function (f) {
          return f(_26);
      };
  });
  var applicativeIdentity = new Prelude.Applicative(function () {
      return applyIdentity;
  }, Identity);
  var monadIdentity = new Prelude.Monad(function () {
      return applicativeIdentity;
  }, function () {
      return bindIdentity;
  });
  exports["Identity"] = Identity;
  exports["runIdentity"] = runIdentity;
  exports["functorIdentity"] = functorIdentity;
  exports["applyIdentity"] = applyIdentity;
  exports["applicativeIdentity"] = applicativeIdentity;
  exports["bindIdentity"] = bindIdentity;
  exports["monadIdentity"] = monadIdentity;;
 
})(PS["Data.Identity"] = PS["Data.Identity"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var $less$dollar = function (__dict_Functor_0) {
      return function (x) {
          return function (f) {
              return Prelude["<$>"](__dict_Functor_0)(Prelude["const"](x))(f);
          };
      };
  };
  var $dollar$greater = function (__dict_Functor_1) {
      return function (f) {
          return function (x) {
              return Prelude["<$>"](__dict_Functor_1)(Prelude["const"](x))(f);
          };
      };
  };
  exports["$>"] = $dollar$greater;
  exports["<$"] = $less$dollar;;
 
})(PS["Data.Functor"] = PS["Data.Functor"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var Profunctor = function (dimap) {
      this.dimap = dimap;
  };
  var profunctorFn = new Profunctor(function (a2b) {
      return function (c2d) {
          return function (b2c) {
              return Prelude[">>>"](Prelude.semigroupoidFn)(a2b)(Prelude[">>>"](Prelude.semigroupoidFn)(b2c)(c2d));
          };
      };
  });
  var dimap = function (dict) {
      return dict.dimap;
  };
  var rmap = function (__dict_Profunctor_1) {
      return function (b2c) {
          return dimap(__dict_Profunctor_1)(Prelude.id(Prelude.categoryFn))(b2c);
      };
  };
  exports["Profunctor"] = Profunctor;
  exports["rmap"] = rmap;
  exports["dimap"] = dimap;
  exports["profunctorFn"] = profunctorFn;;
 
})(PS["Data.Profunctor"] = PS["Data.Profunctor"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var MonadTrans = function (lift) {
      this.lift = lift;
  };
  var lift = function (dict) {
      return dict.lift;
  };
  exports["MonadTrans"] = MonadTrans;
  exports["lift"] = lift;;
 
})(PS["Control.Monad.Trans"] = PS["Control.Monad.Trans"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Exists

  exports.mkExists = function (fa) {
    return fa;
  };

  exports.runExists = function (f) {
    return function (fa) {
      return f(fa);
    };
  };
 
})(PS["Data.Exists"] = PS["Data.Exists"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Exists"];
  var Prelude = PS["Prelude"];
  exports["runExists"] = $foreign.runExists;
  exports["mkExists"] = $foreign.mkExists;;
 
})(PS["Data.Exists"] = PS["Data.Exists"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Control.Monad.Eff

  exports.returnE = function (a) {
    return function () {
      return a;
    };
  };

  exports.bindE = function (a) {
    return function (f) {
      return function () {
        return f(a())();
      };
    };
  };
 
})(PS["Control.Monad.Eff"] = PS["Control.Monad.Eff"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Control.Monad.Eff"];
  var Prelude = PS["Prelude"];     
  var monadEff = new Prelude.Monad(function () {
      return applicativeEff;
  }, function () {
      return bindEff;
  });
  var bindEff = new Prelude.Bind(function () {
      return applyEff;
  }, $foreign.bindE);
  var applyEff = new Prelude.Apply(function () {
      return functorEff;
  }, Prelude.ap(monadEff));
  var applicativeEff = new Prelude.Applicative(function () {
      return applyEff;
  }, $foreign.returnE);
  var functorEff = new Prelude.Functor(Prelude.liftA1(applicativeEff));
  exports["functorEff"] = functorEff;
  exports["applyEff"] = applyEff;
  exports["applicativeEff"] = applicativeEff;
  exports["bindEff"] = bindEff;
  exports["monadEff"] = monadEff;;
 
})(PS["Control.Monad.Eff"] = PS["Control.Monad.Eff"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_ST = PS["Control.Monad.ST"];
  var Data_Either = PS["Data.Either"];
  var Data_Functor = PS["Data.Functor"];
  var Data_Identity = PS["Data.Identity"];
  var Control_Monad_Eff_Unsafe = PS["Control.Monad.Eff.Unsafe"];
  var Data_Either_Unsafe = PS["Data.Either.Unsafe"];     
  var MonadRec = function (__superclass_Prelude$dotMonad_0, tailRecM) {
      this["__superclass_Prelude.Monad_0"] = __superclass_Prelude$dotMonad_0;
      this.tailRecM = tailRecM;
  };
  var tailRecM = function (dict) {
      return dict.tailRecM;
  };             
  var forever = function (__dict_MonadRec_2) {
      return function (ma) {
          return tailRecM(__dict_MonadRec_2)(function (u) {
              return Data_Functor["<$"]((((__dict_MonadRec_2["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(new Data_Either.Left(u))(ma);
          })(Prelude.unit);
      };
  };
  exports["MonadRec"] = MonadRec;
  exports["forever"] = forever;
  exports["tailRecM"] = tailRecM;;
 
})(PS["Control.Monad.Rec.Class"] = PS["Control.Monad.Rec.Class"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Exists = PS["Data.Exists"];
  var Data_Either = PS["Data.Either"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];     
  var Bound = (function () {
      function Bound(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Bound.create = function (value0) {
          return function (value1) {
              return new Bound(value0, value1);
          };
      };
      return Bound;
  })();
  var FreeT = (function () {
      function FreeT(value0) {
          this.value0 = value0;
      };
      FreeT.create = function (value0) {
          return new FreeT(value0);
      };
      return FreeT;
  })();
  var Bind = (function () {
      function Bind(value0) {
          this.value0 = value0;
      };
      Bind.create = function (value0) {
          return new Bind(value0);
      };
      return Bind;
  })();
  var monadTransFreeT = function (__dict_Functor_4) {
      return new Control_Monad_Trans.MonadTrans(function (__dict_Monad_5) {
          return function (ma) {
              return new FreeT(function (_11) {
                  return Prelude.map(((__dict_Monad_5["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Data_Either.Left.create)(ma);
              });
          };
      });
  };
  var freeT = FreeT.create;
  var bound = function (m) {
      return function (f) {
          return new Bind(Data_Exists.mkExists(new Bound(m, f)));
      };
  };
  var functorFreeT = function (__dict_Functor_12) {
      return function (__dict_Functor_13) {
          return new Prelude.Functor(function (f) {
              return function (_17) {
                  if (_17 instanceof FreeT) {
                      return new FreeT(function (_5) {
                          return Prelude.map(__dict_Functor_13)(Data_Bifunctor.bimap(Data_Either.bifunctorEither)(f)(Prelude.map(__dict_Functor_12)(Prelude.map(functorFreeT(__dict_Functor_12)(__dict_Functor_13))(f))))(_17.value0(Prelude.unit));
                      });
                  };
                  if (_17 instanceof Bind) {
                      return Data_Exists.runExists(function (_6) {
                          return bound(_6.value0)(function (_72) {
                              return Prelude.map(functorFreeT(__dict_Functor_12)(__dict_Functor_13))(f)(_6.value1(_72));
                          });
                      })(_17.value0);
                  };
                  throw new Error("Failed pattern match: " + [ f.constructor.name, _17.constructor.name ]);
              };
          });
      };
  };
  var bimapFreeT = function (__dict_Functor_16) {
      return function (__dict_Functor_17) {
          return function (nf) {
              return function (nm) {
                  return function (_15) {
                      if (_15 instanceof Bind) {
                          return Data_Exists.runExists(function (_13) {
                              return bound(function (_73) {
                                  return bimapFreeT(__dict_Functor_16)(__dict_Functor_17)(nf)(nm)(_13.value0(_73));
                              })(function (_74) {
                                  return bimapFreeT(__dict_Functor_16)(__dict_Functor_17)(nf)(nm)(_13.value1(_74));
                              });
                          })(_15.value0);
                      };
                      if (_15 instanceof FreeT) {
                          return new FreeT(function (_14) {
                              return Prelude["<$>"](__dict_Functor_17)(Prelude.map(Data_Either.functorEither)(function (_75) {
                                  return nf(Prelude.map(__dict_Functor_16)(bimapFreeT(__dict_Functor_16)(__dict_Functor_17)(nf)(nm))(_75));
                              }))(nm(_15.value0(Prelude.unit)));
                          });
                      };
                      throw new Error("Failed pattern match: " + [ nf.constructor.name, nm.constructor.name, _15.constructor.name ]);
                  };
              };
          };
      };
  };
  var hoistFreeT = function (__dict_Functor_18) {
      return function (__dict_Functor_19) {
          return bimapFreeT(__dict_Functor_18)(__dict_Functor_19)(Prelude.id(Prelude.categoryFn));
      };
  };
  var monadFreeT = function (__dict_Functor_8) {
      return function (__dict_Monad_9) {
          return new Prelude.Monad(function () {
              return applicativeFreeT(__dict_Functor_8)(__dict_Monad_9);
          }, function () {
              return bindFreeT(__dict_Functor_8)(__dict_Monad_9);
          });
      };
  };
  var bindFreeT = function (__dict_Functor_14) {
      return function (__dict_Monad_15) {
          return new Prelude.Bind(function () {
              return applyFreeT(__dict_Functor_14)(__dict_Monad_15);
          }, function (_18) {
              return function (f) {
                  if (_18 instanceof Bind) {
                      return Data_Exists.runExists(function (_9) {
                          return bound(_9.value0)(function (x) {
                              return bound(function (_8) {
                                  return _9.value1(x);
                              })(f);
                          });
                      })(_18.value0);
                  };
                  return bound(function (_10) {
                      return _18;
                  })(f);
              };
          });
      };
  };
  var applyFreeT = function (__dict_Functor_22) {
      return function (__dict_Monad_23) {
          return new Prelude.Apply(function () {
              return functorFreeT(__dict_Functor_22)(((__dict_Monad_23["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]());
          }, Prelude.ap(monadFreeT(__dict_Functor_22)(__dict_Monad_23)));
      };
  };
  var applicativeFreeT = function (__dict_Functor_24) {
      return function (__dict_Monad_25) {
          return new Prelude.Applicative(function () {
              return applyFreeT(__dict_Functor_24)(__dict_Monad_25);
          }, function (a) {
              return new FreeT(function (_7) {
                  return Prelude.pure(__dict_Monad_25["__superclass_Prelude.Applicative_0"]())(new Data_Either.Left(a));
              });
          });
      };
  };
  var liftFreeT = function (__dict_Functor_10) {
      return function (__dict_Monad_11) {
          return function (fa) {
              return new FreeT(function (_12) {
                  return Prelude["return"](__dict_Monad_11["__superclass_Prelude.Applicative_0"]())(new Data_Either.Right(Prelude.map(__dict_Functor_10)(Prelude.pure(applicativeFreeT(__dict_Functor_10)(__dict_Monad_11)))(fa)));
              });
          };
      };
  };
  var resume = function (__dict_Functor_0) {
      return function (__dict_MonadRec_1) {
          var go = function (_16) {
              if (_16 instanceof FreeT) {
                  return Prelude.map((((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Data_Either.Right.create)(_16.value0(Prelude.unit));
              };
              if (_16 instanceof Bind) {
                  return Data_Exists.runExists(function (_4) {
                      var _51 = _4.value0(Prelude.unit);
                      if (_51 instanceof FreeT) {
                          return Prelude.bind((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())(_51.value0(Prelude.unit))(function (_0) {
                              if (_0 instanceof Data_Either.Left) {
                                  return Prelude["return"]((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Left(_4.value1(_0.value0)));
                              };
                              if (_0 instanceof Data_Either.Right) {
                                  return Prelude["return"]((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Right(new Data_Either.Right(Prelude.map(__dict_Functor_0)(function (h) {
                                      return Prelude[">>="](bindFreeT(__dict_Functor_0)(__dict_MonadRec_1["__superclass_Prelude.Monad_0"]()))(h)(_4.value1);
                                  })(_0.value0))));
                              };
                              throw new Error("Failed pattern match at Control.Monad.Free.Trans line 43, column 3 - line 44, column 3: " + [ _0.constructor.name ]);
                          });
                      };
                      if (_51 instanceof Bind) {
                          return Data_Exists.runExists(function (_3) {
                              return Prelude["return"]((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Left(Prelude.bind(bindFreeT(__dict_Functor_0)(__dict_MonadRec_1["__superclass_Prelude.Monad_0"]()))(_3.value0(Prelude.unit))(function (z) {
                                  return Prelude[">>="](bindFreeT(__dict_Functor_0)(__dict_MonadRec_1["__superclass_Prelude.Monad_0"]()))(_3.value1(z))(_4.value1);
                              })));
                          })(_51.value0);
                      };
                      throw new Error("Failed pattern match at Control.Monad.Free.Trans line 43, column 3 - line 44, column 3: " + [ _51.constructor.name ]);
                  })(_16.value0);
              };
              throw new Error("Failed pattern match at Control.Monad.Free.Trans line 43, column 3 - line 44, column 3: " + [ _16.constructor.name ]);
          };
          return Control_Monad_Rec_Class.tailRecM(__dict_MonadRec_1)(go);
      };
  };
  var runFreeT = function (__dict_Functor_2) {
      return function (__dict_MonadRec_3) {
          return function (interp) {
              var go = function (_19) {
                  if (_19 instanceof Data_Either.Left) {
                      return Prelude["return"]((__dict_MonadRec_3["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Right(_19.value0));
                  };
                  if (_19 instanceof Data_Either.Right) {
                      return Prelude.bind((__dict_MonadRec_3["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())(interp(_19.value0))(function (_2) {
                          return Prelude["return"]((__dict_MonadRec_3["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Left(_2));
                      });
                  };
                  throw new Error("Failed pattern match at Control.Monad.Free.Trans line 103, column 3 - line 104, column 3: " + [ _19.constructor.name ]);
              };
              return Control_Monad_Rec_Class.tailRecM(__dict_MonadRec_3)(Control_Bind["<=<"]((__dict_MonadRec_3["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())(go)(resume(__dict_Functor_2)(__dict_MonadRec_3)));
          };
      };
  };
  var monadRecFreeT = function (__dict_Functor_6) {
      return function (__dict_Monad_7) {
          return new Control_Monad_Rec_Class.MonadRec(function () {
              return monadFreeT(__dict_Functor_6)(__dict_Monad_7);
          }, function (f) {
              var go = function (s) {
                  return Prelude.bind(bindFreeT(__dict_Functor_6)(__dict_Monad_7))(f(s))(function (_1) {
                      if (_1 instanceof Data_Either.Left) {
                          return go(_1.value0);
                      };
                      if (_1 instanceof Data_Either.Right) {
                          return Prelude["return"](applicativeFreeT(__dict_Functor_6)(__dict_Monad_7))(_1.value0);
                      };
                      throw new Error("Failed pattern match at Control.Monad.Free.Trans line 73, column 1 - line 83, column 1: " + [ _1.constructor.name ]);
                  });
              };
              return go;
          });
      };
  };
  exports["runFreeT"] = runFreeT;
  exports["resume"] = resume;
  exports["bimapFreeT"] = bimapFreeT;
  exports["hoistFreeT"] = hoistFreeT;
  exports["liftFreeT"] = liftFreeT;
  exports["freeT"] = freeT;
  exports["functorFreeT"] = functorFreeT;
  exports["applyFreeT"] = applyFreeT;
  exports["applicativeFreeT"] = applicativeFreeT;
  exports["bindFreeT"] = bindFreeT;
  exports["monadFreeT"] = monadFreeT;
  exports["monadTransFreeT"] = monadTransFreeT;
  exports["monadRecFreeT"] = monadRecFreeT;;
 
})(PS["Control.Monad.Free.Trans"] = PS["Control.Monad.Free.Trans"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Either = PS["Data.Either"];
  var Data_Identity = PS["Data.Identity"];
  var Data_Functor = PS["Data.Functor"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Profunctor = PS["Data.Profunctor"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Monad_Free_Trans = PS["Control.Monad.Free.Trans"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var profunctorAwait = new Data_Profunctor.Profunctor(function (f) {
      return function (g) {
          return function (_22) {
              return Data_Profunctor.dimap(Data_Profunctor.profunctorFn)(f)(g)(_22);
          };
      };
  });
  var fuseWith = function (__dict_Functor_4) {
      return function (__dict_Functor_5) {
          return function (__dict_Functor_6) {
              return function (__dict_MonadRec_7) {
                  return function (zap) {
                      return function (fs) {
                          return function (gs) {
                              var go = function (_20) {
                                  return Prelude.bind((__dict_MonadRec_7["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())(Control_Monad_Free_Trans.resume(__dict_Functor_5)(__dict_MonadRec_7)(_20.value1))(function (_1) {
                                      return Prelude.bind((__dict_MonadRec_7["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())(Control_Monad_Free_Trans.resume(__dict_Functor_4)(__dict_MonadRec_7)(_20.value0))(function (_0) {
                                          var _31 = Prelude["<*>"](Data_Either.applyEither)(Prelude["<$>"](Data_Either.functorEither)(zap(Data_Tuple.Tuple.create))(_0))(_1);
                                          if (_31 instanceof Data_Either.Left) {
                                              return Prelude["return"]((__dict_MonadRec_7["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Left(_31.value0));
                                          };
                                          if (_31 instanceof Data_Either.Right) {
                                              return Prelude["return"]((__dict_MonadRec_7["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(new Data_Either.Right(Prelude.map(__dict_Functor_6)(function (t) {
                                                  return Control_Monad_Free_Trans.freeT(function (_5) {
                                                      return go(t);
                                                  });
                                              })(_31.value0)));
                                          };
                                          throw new Error("Failed pattern match at Control.Coroutine line 49, column 1 - line 54, column 1: " + [ _31.constructor.name ]);
                                      });
                                  });
                              };
                              return Control_Monad_Free_Trans.freeT(function (_6) {
                                  return go(new Data_Tuple.Tuple(fs, gs));
                              });
                          };
                      };
                  };
              };
          };
      };
  };
  var functorAwait = new Prelude.Functor(Data_Profunctor.rmap(profunctorAwait));
  var await = function (__dict_Monad_16) {
      return Control_Monad_Free_Trans.liftFreeT(functorAwait)(__dict_Monad_16)(Prelude.id(Prelude.categoryFn));
  };
  exports["await"] = await;
  exports["fuseWith"] = fuseWith;
  exports["profunctorAwait"] = profunctorAwait;
  exports["functorAwait"] = functorAwait;;
 
})(PS["Control.Coroutine"] = PS["Control.Coroutine"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];     
  var MonadEff = function (__superclass_Prelude$dotMonad_0, liftEff) {
      this["__superclass_Prelude.Monad_0"] = __superclass_Prelude$dotMonad_0;
      this.liftEff = liftEff;
  };
  var monadEffEff = new MonadEff(function () {
      return Control_Monad_Eff.monadEff;
  }, Prelude.id(Prelude.categoryFn));
  var liftEff = function (dict) {
      return dict.liftEff;
  };
  exports["MonadEff"] = MonadEff;
  exports["liftEff"] = liftEff;
  exports["monadEffEff"] = monadEffEff;;
 
})(PS["Control.Monad.Eff.Class"] = PS["Control.Monad.Eff.Class"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Either = PS["Data.Either"];     
  var MonadError = function (__superclass_Prelude$dotMonad_0, catchError, throwError) {
      this["__superclass_Prelude.Monad_0"] = __superclass_Prelude$dotMonad_0;
      this.catchError = catchError;
      this.throwError = throwError;
  };
  var throwError = function (dict) {
      return dict.throwError;
  };                          
  var catchError = function (dict) {
      return dict.catchError;
  };
  exports["MonadError"] = MonadError;
  exports["catchError"] = catchError;
  exports["throwError"] = throwError;;
 
})(PS["Control.Monad.Error.Class"] = PS["Control.Monad.Error.Class"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Tuple = PS["Data.Tuple"];     
  var MonadState = function (__superclass_Prelude$dotMonad_0, state) {
      this["__superclass_Prelude.Monad_0"] = __superclass_Prelude$dotMonad_0;
      this.state = state;
  };
  var state = function (dict) {
      return dict.state;
  };
  var put = function (__dict_MonadState_0) {
      return function (s) {
          return state(__dict_MonadState_0)(function (_0) {
              return new Data_Tuple.Tuple(Prelude.unit, s);
          });
      };
  };
  var modify = function (__dict_MonadState_1) {
      return function (f) {
          return state(__dict_MonadState_1)(function (s) {
              return new Data_Tuple.Tuple(Prelude.unit, f(s));
          });
      };
  };
  var gets = function (__dict_MonadState_2) {
      return function (f) {
          return state(__dict_MonadState_2)(function (s) {
              return new Data_Tuple.Tuple(f(s), s);
          });
      };
  };
  var get = function (__dict_MonadState_3) {
      return state(__dict_MonadState_3)(function (s) {
          return new Data_Tuple.Tuple(s, s);
      });
  };
  exports["MonadState"] = MonadState;
  exports["modify"] = modify;
  exports["put"] = put;
  exports["gets"] = gets;
  exports["get"] = get;
  exports["state"] = state;;
 
})(PS["Control.Monad.State.Class"] = PS["Control.Monad.State.Class"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Monoid = PS["Data.Monoid"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Monad_Cont_Class = PS["Control.Monad.Cont.Class"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Error_Class = PS["Control.Monad.Error.Class"];
  var Control_Monad_Reader_Class = PS["Control.Monad.Reader.Class"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_RWS_Class = PS["Control.Monad.RWS.Class"];
  var Control_Monad_State_Class = PS["Control.Monad.State.Class"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Monad_Writer_Class = PS["Control.Monad.Writer.Class"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];     
  var MaybeT = function (x) {
      return x;
  };
  var runMaybeT = function (_5) {
      return _5;
  };
  var monadMaybeT = function (__dict_Monad_7) {
      return new Prelude.Monad(function () {
          return applicativeMaybeT(__dict_Monad_7);
      }, function () {
          return bindMaybeT(__dict_Monad_7);
      });
  };
  var functorMaybeT = function (__dict_Monad_14) {
      return new Prelude.Functor(Prelude.liftA1(applicativeMaybeT(__dict_Monad_14)));
  };
  var bindMaybeT = function (__dict_Monad_15) {
      return new Prelude.Bind(function () {
          return applyMaybeT(__dict_Monad_15);
      }, function (x) {
          return function (f) {
              return MaybeT(Prelude.bind(__dict_Monad_15["__superclass_Prelude.Bind_1"]())(runMaybeT(x))(function (_0) {
                  if (_0 instanceof Data_Maybe.Nothing) {
                      return Prelude["return"](__dict_Monad_15["__superclass_Prelude.Applicative_0"]())(Data_Maybe.Nothing.value);
                  };
                  if (_0 instanceof Data_Maybe.Just) {
                      return runMaybeT(f(_0.value0));
                  };
                  throw new Error("Failed pattern match: " + [ _0.constructor.name ]);
              }));
          };
      });
  };
  var applyMaybeT = function (__dict_Monad_16) {
      return new Prelude.Apply(function () {
          return functorMaybeT(__dict_Monad_16);
      }, Prelude.ap(monadMaybeT(__dict_Monad_16)));
  };
  var applicativeMaybeT = function (__dict_Monad_17) {
      return new Prelude.Applicative(function () {
          return applyMaybeT(__dict_Monad_17);
      }, function (_28) {
          return MaybeT(Prelude.pure(__dict_Monad_17["__superclass_Prelude.Applicative_0"]())(Data_Maybe.Just.create(_28)));
      });
  };
  var monadRecMaybeT = function (__dict_MonadRec_3) {
      return new Control_Monad_Rec_Class.MonadRec(function () {
          return monadMaybeT(__dict_MonadRec_3["__superclass_Prelude.Monad_0"]());
      }, function (f) {
          return function (_31) {
              return MaybeT(Control_Monad_Rec_Class.tailRecM(__dict_MonadRec_3)(function (a) {
                  return Prelude.bind((__dict_MonadRec_3["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())(runMaybeT(f(a)))(function (_2) {
                      return Prelude["return"]((__dict_MonadRec_3["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())((function () {
                          if (_2 instanceof Data_Maybe.Nothing) {
                              return new Data_Either.Right(Data_Maybe.Nothing.value);
                          };
                          if (_2 instanceof Data_Maybe.Just && _2.value0 instanceof Data_Either.Left) {
                              return new Data_Either.Left(_2.value0.value0);
                          };
                          if (_2 instanceof Data_Maybe.Just && _2.value0 instanceof Data_Either.Right) {
                              return new Data_Either.Right(new Data_Maybe.Just(_2.value0.value0));
                          };
                          throw new Error("Failed pattern match at Control.Monad.Maybe.Trans line 78, column 1 - line 86, column 1: " + [ _2.constructor.name ]);
                      })());
                  });
              })(_31));
          };
      });
  };
  var altMaybeT = function (__dict_Monad_19) {
      return new Control_Alt.Alt(function () {
          return functorMaybeT(__dict_Monad_19);
      }, function (m1) {
          return function (m2) {
              return Prelude.bind(__dict_Monad_19["__superclass_Prelude.Bind_1"]())(runMaybeT(m1))(function (_1) {
                  if (_1 instanceof Data_Maybe.Nothing) {
                      return runMaybeT(m2);
                  };
                  return Prelude["return"](__dict_Monad_19["__superclass_Prelude.Applicative_0"]())(_1);
              });
          };
      });
  };
  var plusMaybeT = function (__dict_Monad_0) {
      return new Control_Plus.Plus(function () {
          return altMaybeT(__dict_Monad_0);
      }, Prelude.pure(__dict_Monad_0["__superclass_Prelude.Applicative_0"]())(Data_Maybe.Nothing.value));
  };
  exports["MaybeT"] = MaybeT;
  exports["runMaybeT"] = runMaybeT;
  exports["functorMaybeT"] = functorMaybeT;
  exports["applyMaybeT"] = applyMaybeT;
  exports["applicativeMaybeT"] = applicativeMaybeT;
  exports["bindMaybeT"] = bindMaybeT;
  exports["monadMaybeT"] = monadMaybeT;
  exports["altMaybeT"] = altMaybeT;
  exports["plusMaybeT"] = plusMaybeT;
  exports["monadRecMaybeT"] = monadRecMaybeT;;
 
})(PS["Control.Monad.Maybe.Trans"] = PS["Control.Monad.Maybe.Trans"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Coroutine = PS["Control.Coroutine"];
  var Control_Monad_Free_Trans = PS["Control.Monad.Free.Trans"];
  var Control_Monad_Maybe_Trans = PS["Control.Monad.Maybe.Trans"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Functor = PS["Data.Functor"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Either = PS["Data.Either"];
  var Data_Identity = PS["Data.Identity"];
  var Data_Maybe = PS["Data.Maybe"];     
  var Emit = (function () {
      function Emit(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Emit.create = function (value0) {
          return function (value1) {
              return new Emit(value0, value1);
          };
      };
      return Emit;
  })();
  var Stall = (function () {
      function Stall(value0) {
          this.value0 = value0;
      };
      Stall.create = function (value0) {
          return new Stall(value0);
      };
      return Stall;
  })();
  var runStallingProcess = function (__dict_MonadRec_2) {
      return function (_19) {
          return Control_Monad_Maybe_Trans.runMaybeT(Control_Monad_Free_Trans.runFreeT(Data_Maybe.functorMaybe)(Control_Monad_Maybe_Trans.monadRecMaybeT(__dict_MonadRec_2))(Data_Maybe.maybe(Control_Plus.empty(Control_Monad_Maybe_Trans.plusMaybeT(__dict_MonadRec_2["__superclass_Prelude.Monad_0"]())))(Prelude.pure(Control_Monad_Maybe_Trans.applicativeMaybeT(__dict_MonadRec_2["__superclass_Prelude.Monad_0"]()))))(Control_Monad_Free_Trans.hoistFreeT(Data_Maybe.functorMaybe)(Control_Monad_Maybe_Trans.functorMaybeT(__dict_MonadRec_2["__superclass_Prelude.Monad_0"]()))(function (_20) {
              return Control_Monad_Maybe_Trans.MaybeT(Prelude.map((((__dict_MonadRec_2["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Data_Maybe.Just.create)(_20));
          })(_19)));
      };
  };
  var bifunctorStallF = new Data_Bifunctor.Bifunctor(function (f) {
      return function (g) {
          return function (q) {
              if (q instanceof Emit) {
                  return new Emit(f(q.value0), g(q.value1));
              };
              if (q instanceof Stall) {
                  return new Stall(g(q.value0));
              };
              throw new Error("Failed pattern match at Control.Coroutine.Stalling line 50, column 1 - line 56, column 1: " + [ q.constructor.name ]);
          };
      };
  });
  var functorStallF = new Prelude.Functor(function (f) {
      return Data_Bifunctor.rmap(bifunctorStallF)(f);
  });
  var $dollar$dollar$qmark = function (__dict_MonadRec_0) {
      return Control_Coroutine.fuseWith(functorStallF)(Control_Coroutine.functorAwait)(Data_Maybe.functorMaybe)(__dict_MonadRec_0)(function (f) {
          return function (q) {
              return function (_0) {
                  if (q instanceof Emit) {
                      return new Data_Maybe.Just(f(q.value1)(_0(q.value0)));
                  };
                  if (q instanceof Stall) {
                      return Data_Maybe.Nothing.value;
                  };
                  throw new Error("Failed pattern match at Control.Coroutine.Stalling line 79, column 1 - line 85, column 1: " + [ q.constructor.name ]);
              };
          };
      });
  };
  exports["Emit"] = Emit;
  exports["Stall"] = Stall;
  exports["$$?"] = $dollar$dollar$qmark;
  exports["runStallingProcess"] = runStallingProcess;
  exports["bifunctorStallF"] = bifunctorStallF;
  exports["functorStallF"] = functorStallF;;
 
})(PS["Control.Coroutine.Stalling"] = PS["Control.Coroutine.Stalling"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports._setTimeout = function (nonCanceler, millis, aff) {
    var set = setTimeout, clear = clearTimeout;
    if (millis <= 0 && typeof setImmediate === "function") {
      set = setImmediate;
      clear = clearImmediate;
    }
    return function(success, error) {
      var canceler;

      var timeout = set(function() {
        canceler = aff(success, error);
      }, millis);

      return function(e) {
        return function(s, f) {
          if (canceler !== undefined) {
            return canceler(e)(s, f);
          } else {
            clear(timeout);

            try {
              s(true);
            } catch (e) {
              f(e);
            }

            return nonCanceler;
          }
        };
      };
    };
  }

  exports._forkAff = function (nonCanceler, aff) {
    var voidF = function(){};

    return function(success, error) {
      var canceler = aff(voidF, voidF);

      try {
        success(canceler);
      } catch (e) {
        error(e);
      }

      return nonCanceler;
    };
  }

  exports._makeAff = function (cb) {
    return function(success, error) {
      return cb(function(e) {
        return function() {
          error(e);
        };
      })(function(v) {
        return function() {
          try {
            success(v);
          } catch (e) {
            error(e);
          }
        };
      })();
    }
  }

  exports._pure = function (nonCanceler, v) {
    return function(success, error) {
      try {
        success(v);
      } catch (e) {
        error(e);
      }

      return nonCanceler;
    };
  }

  exports._throwError = function (nonCanceler, e) {
    return function(success, error) {
      error(e);

      return nonCanceler;
    };
  }

  exports._fmap = function (f, aff) {
    return function(success, error) {
      return aff(function(v) {
        try {
          success(f(v));
        } catch (e) {
          error(e);
        }
      }, error);
    };
  }

  exports._bind = function (alwaysCanceler, aff, f) {
    return function(success, error) {
      var canceler1, canceler2;

      var isCanceled    = false;
      var requestCancel = false;

      var onCanceler = function(){};

      canceler1 = aff(function(v) {
        if (requestCancel) {
          isCanceled = true;

          return alwaysCanceler;
        } else {
          canceler2 = f(v)(success, error);

          onCanceler(canceler2);

          return canceler2;
        }
      }, error);

      return function(e) {
        return function(s, f) {
          requestCancel = true;

          if (canceler2 !== undefined) {
            return canceler2(e)(s, f);
          } else {
            return canceler1(e)(function(bool) {
              if (bool || isCanceled) {
                try {
                  s(true);
                } catch (e) {
                  f(e);
                }
              } else {
                onCanceler = function(canceler) {
                  canceler(e)(s, f);
                };
              }
            }, f);
          }
        };
      };
    };
  }

  exports._attempt = function (Left, Right, aff) {
    return function(success, error) {
      return aff(function(v) {
        try {
          success(Right(v));
        } catch (e) {
          error(e);
        }
      }, function(e) {
        try {
          success(Left(e));
        } catch (e) {
          error(e);
        }
      });
    };
  }

  exports._runAff = function (errorT, successT, aff) {
    return function() {
      return aff(function(v) {
        try {
          successT(v)();
        } catch (e) {
          errorT(e)();
        }
      }, function(e) {
        errorT(e)();
      });
    };
  }

  exports._liftEff = function (nonCanceler, e) {
    return function(success, error) {
      try {
        success(e());
      } catch (e) {
        error(e);
      }

      return nonCanceler;
    };
  }
 
})(PS["Control.Monad.Aff"] = PS["Control.Monad.Aff"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.error = function (msg) {
    return new Error(msg);
  };

  exports.throwException = function (e) {
    return function () {
      throw e;
    };
  };
 
})(PS["Control.Monad.Eff.Exception"] = PS["Control.Monad.Eff.Exception"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Control.Monad.Eff.Exception"];
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  exports["throwException"] = $foreign.throwException;
  exports["error"] = $foreign.error;;
 
})(PS["Control.Monad.Eff.Exception"] = PS["Control.Monad.Eff.Exception"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.runFn2 = function (fn) {
    return function (a) {
      return function (b) {
        return fn(a, b);
      };
    };
  };
 
})(PS["Data.Function"] = PS["Data.Function"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Function"];
  var Prelude = PS["Prelude"];
  exports["runFn2"] = $foreign.runFn2;;
 
})(PS["Data.Function"] = PS["Data.Function"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Control.Monad.Aff"];
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Monad_Cont_Class = PS["Control.Monad.Cont.Class"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Control_Monad_Error_Class = PS["Control.Monad.Error.Class"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Either = PS["Data.Either"];
  var Data_Function = PS["Data.Function"];
  var Data_Monoid = PS["Data.Monoid"];
  var runAff = function (ex) {
      return function (f) {
          return function (aff) {
              return $foreign._runAff(ex, f, aff);
          };
      };
  };
  var makeAff$prime = function (h) {
      return $foreign._makeAff(h);
  };
  var functorAff = new Prelude.Functor(function (f) {
      return function (fa) {
          return $foreign._fmap(f, fa);
      };
  });
  var attempt = function (aff) {
      return $foreign._attempt(Data_Either.Left.create, Data_Either.Right.create, aff);
  };
  var applyAff = new Prelude.Apply(function () {
      return functorAff;
  }, function (ff) {
      return function (fa) {
          return $foreign._bind(alwaysCanceler, ff, function (f) {
              return Prelude["<$>"](functorAff)(f)(fa);
          });
      };
  });
  var applicativeAff = new Prelude.Applicative(function () {
      return applyAff;
  }, function (v) {
      return $foreign._pure(nonCanceler, v);
  });
  var nonCanceler = Prelude["const"](Prelude.pure(applicativeAff)(false));
  var alwaysCanceler = Prelude["const"](Prelude.pure(applicativeAff)(true));
  var forkAff = function (aff) {
      return $foreign._forkAff(nonCanceler, aff);
  };
  var later$prime = function (n) {
      return function (aff) {
          return $foreign._setTimeout(nonCanceler, n, aff);
      };
  };
  var later = later$prime(0);
  var makeAff = function (h) {
      return makeAff$prime(function (e) {
          return function (a) {
              return Prelude["<$>"](Control_Monad_Eff.functorEff)(Prelude["const"](nonCanceler))(h(e)(a));
          };
      });
  };                                                       
  var bindAff = new Prelude.Bind(function () {
      return applyAff;
  }, function (fa) {
      return function (f) {
          return $foreign._bind(alwaysCanceler, fa, f);
      };
  });
  var monadAff = new Prelude.Monad(function () {
      return applicativeAff;
  }, function () {
      return bindAff;
  });
  var monadEffAff = new Control_Monad_Eff_Class.MonadEff(function () {
      return monadAff;
  }, function (eff) {
      return $foreign._liftEff(nonCanceler, eff);
  });
  var monadErrorAff = new Control_Monad_Error_Class.MonadError(function () {
      return monadAff;
  }, function (aff) {
      return function (ex) {
          return Prelude[">>="](bindAff)(attempt(aff))(Data_Either.either(ex)(Prelude.pure(applicativeAff)));
      };
  }, function (e) {
      return $foreign._throwError(nonCanceler, e);
  });
  var monadRecAff = new Control_Monad_Rec_Class.MonadRec(function () {
      return monadAff;
  }, function (f) {
      return function (a) {
          var go = function (size) {
              return function (f_1) {
                  return function (a_1) {
                      return Prelude.bind(bindAff)(f_1(a_1))(function (_1) {
                          if (_1 instanceof Data_Either.Left) {
                              if (size < 100) {
                                  return go(size + 1 | 0)(f_1)(_1.value0);
                              };
                              if (Prelude.otherwise) {
                                  return later(Control_Monad_Rec_Class.tailRecM(monadRecAff)(f_1)(_1.value0));
                              };
                          };
                          if (_1 instanceof Data_Either.Right) {
                              return Prelude.pure(applicativeAff)(_1.value0);
                          };
                          throw new Error("Failed pattern match: " + [ _1.constructor.name ]);
                      });
                  };
              };
          };
          return go(0)(f)(a);
      };
  });
  var altAff = new Control_Alt.Alt(function () {
      return functorAff;
  }, function (a1) {
      return function (a2) {
          return Prelude[">>="](bindAff)(attempt(a1))(Data_Either.either(Prelude["const"](a2))(Prelude.pure(applicativeAff)));
      };
  });
  var plusAff = new Control_Plus.Plus(function () {
      return altAff;
  }, Control_Monad_Error_Class.throwError(monadErrorAff)(Control_Monad_Eff_Exception.error("Always fails")));
  exports["runAff"] = runAff;
  exports["nonCanceler"] = nonCanceler;
  exports["makeAff'"] = makeAff$prime;
  exports["makeAff"] = makeAff;
  exports["later"] = later;
  exports["forkAff"] = forkAff;
  exports["attempt"] = attempt;
  exports["functorAff"] = functorAff;
  exports["applyAff"] = applyAff;
  exports["applicativeAff"] = applicativeAff;
  exports["bindAff"] = bindAff;
  exports["monadAff"] = monadAff;
  exports["monadEffAff"] = monadEffAff;
  exports["monadErrorAff"] = monadErrorAff;
  exports["altAff"] = altAff;
  exports["plusAff"] = plusAff;
  exports["monadRecAff"] = monadRecAff;;
 
})(PS["Control.Monad.Aff"] = PS["Control.Monad.Aff"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Control.Monad.Aff.AVar

  exports._makeVar = function (nonCanceler) {
    return function(success, error) {
      try {
        success({
          consumers: [],
          producers: [],
          error: undefined 
        });
      } catch (e) {
        error(e);
      }

      return nonCanceler;
    }
  }

  exports._takeVar = function (nonCanceler, avar) {
    return function(success, error) {
      if (avar.error !== undefined) {
        error(avar.error);
      } else if (avar.producers.length > 0) {
        var producer = avar.producers.shift();

        producer(success, error);
      } else {
        avar.consumers.push({success: success, error: error});
      }

      return nonCanceler;
    } 
  }

  exports._putVar = function (nonCanceler, avar, a) {
    return function(success, error) {
      if (avar.error !== undefined) {
        error(avar.error);
      } else if (avar.consumers.length === 0) {
        avar.producers.push(function(success, error) {
          try {
            success(a);
          } catch (e) {
            error(e);
          }
        });

        success({});
      } else {
        var consumer = avar.consumers.shift();

        try {
          consumer.success(a);
        } catch (e) {
          error(e);

          return;                  
        }

        success({});
      }

      return nonCanceler;
    }
  }
 
})(PS["Control.Monad.Aff.AVar"] = PS["Control.Monad.Aff.AVar"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Control.Monad.Aff.AVar"];
  var Prelude = PS["Prelude"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Data_Function = PS["Data.Function"];     
  var takeVar = function (q) {
      return $foreign._takeVar(Control_Monad_Aff.nonCanceler, q);
  };
  var putVar = function (q) {
      return function (a) {
          return $foreign._putVar(Control_Monad_Aff.nonCanceler, q, a);
      };
  };
  var makeVar = $foreign._makeVar(Control_Monad_Aff.nonCanceler);
  exports["takeVar"] = takeVar;
  exports["putVar"] = putVar;
  exports["makeVar"] = makeVar;;
 
})(PS["Control.Monad.Aff.AVar"] = PS["Control.Monad.Aff.AVar"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Either = PS["Data.Either"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Lazy = PS["Control.Lazy"];
  var Control_Monad_Cont_Class = PS["Control.Monad.Cont.Class"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Error_Class = PS["Control.Monad.Error.Class"];
  var Control_Monad_Reader_Class = PS["Control.Monad.Reader.Class"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_State_Class = PS["Control.Monad.State.Class"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Monad_Writer_Class = PS["Control.Monad.Writer.Class"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];     
  var StateT = function (x) {
      return x;
  };
  var runStateT = function (_6) {
      return _6;
  };
  var monadStateT = function (__dict_Monad_5) {
      return new Prelude.Monad(function () {
          return applicativeStateT(__dict_Monad_5);
      }, function () {
          return bindStateT(__dict_Monad_5);
      });
  };
  var functorStateT = function (__dict_Monad_14) {
      return new Prelude.Functor(Prelude.liftM1(monadStateT(__dict_Monad_14)));
  };
  var bindStateT = function (__dict_Monad_17) {
      return new Prelude.Bind(function () {
          return applyStateT(__dict_Monad_17);
      }, function (_7) {
          return function (f) {
              return function (s) {
                  return Prelude.bind(__dict_Monad_17["__superclass_Prelude.Bind_1"]())(_7(s))(function (_0) {
                      return runStateT(f(_0.value0))(_0.value1);
                  });
              };
          };
      });
  };
  var applyStateT = function (__dict_Monad_18) {
      return new Prelude.Apply(function () {
          return functorStateT(__dict_Monad_18);
      }, Prelude.ap(monadStateT(__dict_Monad_18)));
  };
  var applicativeStateT = function (__dict_Monad_19) {
      return new Prelude.Applicative(function () {
          return applyStateT(__dict_Monad_19);
      }, function (a) {
          return StateT(function (s) {
              return Prelude["return"](__dict_Monad_19["__superclass_Prelude.Applicative_0"]())(new Data_Tuple.Tuple(a, s));
          });
      });
  };
  var monadStateStateT = function (__dict_Monad_6) {
      return new Control_Monad_State_Class.MonadState(function () {
          return monadStateT(__dict_Monad_6);
      }, function (f) {
          return StateT(function (_39) {
              return Prelude["return"](__dict_Monad_6["__superclass_Prelude.Applicative_0"]())(f(_39));
          });
      });
  };
  exports["StateT"] = StateT;
  exports["runStateT"] = runStateT;
  exports["functorStateT"] = functorStateT;
  exports["applyStateT"] = applyStateT;
  exports["applicativeStateT"] = applicativeStateT;
  exports["bindStateT"] = bindStateT;
  exports["monadStateT"] = monadStateT;
  exports["monadStateStateT"] = monadStateStateT;;
 
})(PS["Control.Monad.State.Trans"] = PS["Control.Monad.State.Trans"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Tuple = PS["Data.Tuple"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Monad_Cont_Class = PS["Control.Monad.Cont.Class"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Error_Class = PS["Control.Monad.Error.Class"];
  var Control_Monad_Reader_Class = PS["Control.Monad.Reader.Class"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_State_Class = PS["Control.Monad.State.Class"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Monad_Writer_Class = PS["Control.Monad.Writer.Class"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];     
  var WriterT = function (x) {
      return x;
  };
  var runWriterT = function (_7) {
      return _7;
  };
  var mapWriterT = function (f) {
      return function (m) {
          return WriterT(f(runWriterT(m)));
      };
  };
  var functorWriterT = function (__dict_Functor_22) {
      return new Prelude.Functor(function (f) {
          return mapWriterT(Prelude["<$>"](__dict_Functor_22)(function (_6) {
              return new Data_Tuple.Tuple(f(_6.value0), _6.value1);
          }));
      });
  };
  var applyWriterT = function (__dict_Semigroup_26) {
      return function (__dict_Apply_27) {
          return new Prelude.Apply(function () {
              return functorWriterT(__dict_Apply_27["__superclass_Prelude.Functor_0"]());
          }, function (f) {
              return function (v) {
                  return WriterT((function () {
                      var k = function (_8) {
                          return function (_9) {
                              return new Data_Tuple.Tuple(_8.value0(_9.value0), Prelude["<>"](__dict_Semigroup_26)(_8.value1)(_9.value1));
                          };
                      };
                      return Prelude["<*>"](__dict_Apply_27)(Prelude["<$>"](__dict_Apply_27["__superclass_Prelude.Functor_0"]())(k)(runWriterT(f)))(runWriterT(v));
                  })());
              };
          });
      };
  };
  var applicativeWriterT = function (__dict_Monoid_28) {
      return function (__dict_Applicative_29) {
          return new Prelude.Applicative(function () {
              return applyWriterT(__dict_Monoid_28["__superclass_Prelude.Semigroup_0"]())(__dict_Applicative_29["__superclass_Prelude.Apply_0"]());
          }, function (a) {
              return WriterT(Prelude.pure(__dict_Applicative_29)(new Data_Tuple.Tuple(a, Data_Monoid.mempty(__dict_Monoid_28))));
          });
      };
  };
  exports["WriterT"] = WriterT;
  exports["mapWriterT"] = mapWriterT;
  exports["runWriterT"] = runWriterT;
  exports["functorWriterT"] = functorWriterT;
  exports["applyWriterT"] = applyWriterT;
  exports["applicativeWriterT"] = applicativeWriterT;;
 
})(PS["Control.Monad.Writer.Trans"] = PS["Control.Monad.Writer.Trans"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Cont_Trans = PS["Control.Monad.Cont.Trans"];
  var Control_Monad_Except_Trans = PS["Control.Monad.Except.Trans"];
  var Control_Monad_List_Trans = PS["Control.Monad.List.Trans"];
  var Control_Monad_Maybe_Trans = PS["Control.Monad.Maybe.Trans"];
  var Control_Monad_Reader_Trans = PS["Control.Monad.Reader.Trans"];
  var Control_Monad_RWS_Trans = PS["Control.Monad.RWS.Trans"];
  var Control_Monad_State_Trans = PS["Control.Monad.State.Trans"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Monad_Writer_Trans = PS["Control.Monad.Writer.Trans"];
  var Data_Monoid = PS["Data.Monoid"];     
  var MonadAff = function (liftAff) {
      this.liftAff = liftAff;
  };
  var monadAffAff = new MonadAff(Prelude.id(Prelude.categoryFn));
  var liftAff = function (dict) {
      return dict.liftAff;
  };
  exports["MonadAff"] = MonadAff;
  exports["liftAff"] = liftAff;
  exports["monadAffAff"] = monadAffAff;;
 
})(PS["Control.Monad.Aff.Class"] = PS["Control.Monad.Aff.Class"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Lazy = PS["Control.Lazy"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Unfoldable = PS["Data.Unfoldable"];     
  var Nil = (function () {
      function Nil() {

      };
      Nil.value = new Nil();
      return Nil;
  })();
  var Cons = (function () {
      function Cons(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Cons.create = function (value0) {
          return function (value1) {
              return new Cons(value0, value1);
          };
      };
      return Cons;
  })();
  var reverse = (function () {
      var go = function (__copy_acc) {
          return function (__copy__41) {
              var acc = __copy_acc;
              var _41 = __copy__41;
              tco: while (true) {
                  var acc_1 = acc;
                  if (_41 instanceof Nil) {
                      return acc_1;
                  };
                  if (_41 instanceof Cons) {
                      var __tco_acc = new Cons(_41.value0, acc);
                      var __tco__41 = _41.value1;
                      acc = __tco_acc;
                      _41 = __tco__41;
                      continue tco;
                  };
                  throw new Error("Failed pattern match at Data.List line 365, column 1 - line 366, column 1: " + [ acc.constructor.name, _41.constructor.name ]);
              };
          };
      };
      return go(Nil.value);
  })();
  exports["Nil"] = Nil;
  exports["Cons"] = Cons;
  exports["reverse"] = reverse;;
 
})(PS["Data.List"] = PS["Data.List"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_List = PS["Data.List"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Tuple = PS["Data.Tuple"];     
  var CatQueue = (function () {
      function CatQueue(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      CatQueue.create = function (value0) {
          return function (value1) {
              return new CatQueue(value0, value1);
          };
      };
      return CatQueue;
  })();
  var uncons = function (__copy__2) {
      var _2 = __copy__2;
      tco: while (true) {
          if (_2.value0 instanceof Data_List.Nil && _2.value1 instanceof Data_List.Nil) {
              return Data_Maybe.Nothing.value;
          };
          if (_2.value0 instanceof Data_List.Nil) {
              var __tco__2 = new CatQueue(Data_List.reverse(_2.value1), Data_List.Nil.value);
              _2 = __tco__2;
              continue tco;
          };
          if (_2.value0 instanceof Data_List.Cons) {
              return new Data_Maybe.Just(new Data_Tuple.Tuple(_2.value0.value0, new CatQueue(_2.value0.value1, _2.value1)));
          };
          throw new Error("Failed pattern match: " + [ _2.constructor.name ]);
      };
  };
  var snoc = function (_1) {
      return function (a) {
          return new CatQueue(_1.value0, new Data_List.Cons(a, _1.value1));
      };
  };
  var $$null = function (_0) {
      if (_0.value0 instanceof Data_List.Nil && _0.value1 instanceof Data_List.Nil) {
          return true;
      };
      return false;
  };
  var empty = new CatQueue(Data_List.Nil.value, Data_List.Nil.value);
  exports["CatQueue"] = CatQueue;
  exports["uncons"] = uncons;
  exports["snoc"] = snoc;
  exports["null"] = $$null;
  exports["empty"] = empty;;
 
})(PS["Data.CatQueue"] = PS["Data.CatQueue"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_CatQueue = PS["Data.CatQueue"];
  var Data_List = PS["Data.List"];     
  var CatNil = (function () {
      function CatNil() {

      };
      CatNil.value = new CatNil();
      return CatNil;
  })();
  var CatCons = (function () {
      function CatCons(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      CatCons.create = function (value0) {
          return function (value1) {
              return new CatCons(value0, value1);
          };
      };
      return CatCons;
  })();
  var link = function (_4) {
      return function (cat) {
          if (_4 instanceof CatNil) {
              return cat;
          };
          if (_4 instanceof CatCons) {
              return new CatCons(_4.value0, Data_CatQueue.snoc(_4.value1)(cat));
          };
          throw new Error("Failed pattern match at Data.CatList line 88, column 1 - line 89, column 1: " + [ _4.constructor.name, cat.constructor.name ]);
      };
  };
  var foldr = function (k) {
      return function (b) {
          return function (q) {
              var foldl = function (__copy_k_1) {
                  return function (__copy_c) {
                      return function (__copy__5) {
                          var k_1 = __copy_k_1;
                          var c = __copy_c;
                          var _5 = __copy__5;
                          tco: while (true) {
                              var c_1 = c;
                              if (_5 instanceof Data_List.Nil) {
                                  return c_1;
                              };
                              if (_5 instanceof Data_List.Cons) {
                                  var __tco_k_1 = k_1;
                                  var __tco_c = k_1(c)(_5.value0);
                                  var __tco__5 = _5.value1;
                                  k_1 = __tco_k_1;
                                  c = __tco_c;
                                  _5 = __tco__5;
                                  continue tco;
                              };
                              throw new Error("Failed pattern match at Data.CatList line 95, column 1 - line 96, column 1: " + [ k_1.constructor.name, c.constructor.name, _5.constructor.name ]);
                          };
                      };
                  };
              };
              var go = function (__copy_xs) {
                  return function (__copy_ys) {
                      var xs = __copy_xs;
                      var ys = __copy_ys;
                      tco: while (true) {
                          var _20 = Data_CatQueue.uncons(xs);
                          if (_20 instanceof Data_Maybe.Nothing) {
                              return foldl(function (x) {
                                  return function (i) {
                                      return i(x);
                                  };
                              })(b)(ys);
                          };
                          if (_20 instanceof Data_Maybe.Just) {
                              var __tco_ys = new Data_List.Cons(k(_20.value0.value0), ys);
                              xs = _20.value0.value1;
                              ys = __tco_ys;
                              continue tco;
                          };
                          throw new Error("Failed pattern match at Data.CatList line 95, column 1 - line 96, column 1: " + [ _20.constructor.name ]);
                      };
                  };
              };
              return go(q)(Data_List.Nil.value);
          };
      };
  };
  var uncons = function (_3) {
      if (_3 instanceof CatNil) {
          return Data_Maybe.Nothing.value;
      };
      if (_3 instanceof CatCons) {
          return new Data_Maybe.Just(new Data_Tuple.Tuple(_3.value0, (function () {
              var _25 = Data_CatQueue["null"](_3.value1);
              if (_25) {
                  return CatNil.value;
              };
              if (!_25) {
                  return foldr(link)(CatNil.value)(_3.value1);
              };
              throw new Error("Failed pattern match at Data.CatList line 79, column 1 - line 80, column 1: " + [ _25.constructor.name ]);
          })()));
      };
      throw new Error("Failed pattern match at Data.CatList line 79, column 1 - line 80, column 1: " + [ _3.constructor.name ]);
  };
  var empty = CatNil.value;
  var append = function (_1) {
      return function (_2) {
          if (_2 instanceof CatNil) {
              return _1;
          };
          if (_1 instanceof CatNil) {
              return _2;
          };
          return link(_1)(_2);
      };
  };
  var semigroupCatList = new Prelude.Semigroup(append);
  var snoc = function (cat) {
      return function (a) {
          return append(cat)(new CatCons(a, Data_CatQueue.empty));
      };
  };
  exports["CatNil"] = CatNil;
  exports["CatCons"] = CatCons;
  exports["uncons"] = uncons;
  exports["snoc"] = snoc;
  exports["append"] = append;
  exports["empty"] = empty;
  exports["semigroupCatList"] = semigroupCatList;;
 
})(PS["Data.CatList"] = PS["Data.CatList"] || {});
(function(exports) {
  "use strict";

  // module Unsafe.Coerce

  exports.unsafeCoerce = function(x) { return x; }
 
})(PS["Unsafe.Coerce"] = PS["Unsafe.Coerce"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Unsafe.Coerce"];
  exports["unsafeCoerce"] = $foreign.unsafeCoerce;;
 
})(PS["Unsafe.Coerce"] = PS["Unsafe.Coerce"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Data_CatList = PS["Data.CatList"];
  var Data_Either = PS["Data.Either"];
  var Data_Identity = PS["Data.Identity"];
  var Data_Inject = PS["Data.Inject"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_NaturalTransformation = PS["Data.NaturalTransformation"];
  var Data_Tuple = PS["Data.Tuple"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];
  var Free = (function () {
      function Free(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Free.create = function (value0) {
          return function (value1) {
              return new Free(value0, value1);
          };
      };
      return Free;
  })();
  var Return = (function () {
      function Return(value0) {
          this.value0 = value0;
      };
      Return.create = function (value0) {
          return new Return(value0);
      };
      return Return;
  })();
  var Bind = (function () {
      function Bind(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Bind.create = function (value0) {
          return function (value1) {
              return new Bind(value0, value1);
          };
      };
      return Bind;
  })();
  var toView = function (__copy__0) {
      var _0 = __copy__0;
      tco: while (true) {
          var runExpF = function (_3) {
              return _3;
          };
          var concatF = function (_2) {
              return function (r) {
                  return new Free(_2.value0, Prelude["<>"](Data_CatList.semigroupCatList)(_2.value1)(r));
              };
          };
          if (_0.value0 instanceof Return) {
              var _11 = Data_CatList.uncons(_0.value1);
              if (_11 instanceof Data_Maybe.Nothing) {
                  return new Return(Unsafe_Coerce.unsafeCoerce(_0.value0.value0));
              };
              if (_11 instanceof Data_Maybe.Just) {
                  var __tco__0 = Unsafe_Coerce.unsafeCoerce(concatF(runExpF(_11.value0.value0)(_0.value0.value0))(_11.value0.value1));
                  _0 = __tco__0;
                  continue tco;
              };
              throw new Error("Failed pattern match: " + [ _11.constructor.name ]);
          };
          if (_0.value0 instanceof Bind) {
              return new Bind(_0.value0.value0, function (a) {
                  return Unsafe_Coerce.unsafeCoerce(concatF(_0.value0.value1(a))(_0.value1));
              });
          };
          throw new Error("Failed pattern match: " + [ _0.value0.constructor.name ]);
      };
  };
  var runFreeM = function (__dict_Functor_0) {
      return function (__dict_MonadRec_1) {
          return function (k) {
              var go = function (f) {
                  var _20 = toView(f);
                  if (_20 instanceof Return) {
                      return Prelude["<$>"]((((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Data_Either.Right.create)(Prelude.pure((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Applicative_0"]())(_20.value0));
                  };
                  if (_20 instanceof Bind) {
                      return Prelude["<$>"]((((__dict_MonadRec_1["__superclass_Prelude.Monad_0"]())["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Data_Either.Left.create)(k(Prelude["<$>"](__dict_Functor_0)(_20.value1)(_20.value0)));
                  };
                  throw new Error("Failed pattern match at Control.Monad.Free line 123, column 3 - line 124, column 3: " + [ _20.constructor.name ]);
              };
              return Control_Monad_Rec_Class.tailRecM(__dict_MonadRec_1)(go);
          };
      };
  };
  var fromView = function (f) {
      return new Free(Unsafe_Coerce.unsafeCoerce(f), Data_CatList.empty);
  };
  var freeMonad = new Prelude.Monad(function () {
      return freeApplicative;
  }, function () {
      return freeBind;
  });
  var freeFunctor = new Prelude.Functor(function (k) {
      return function (f) {
          return Prelude[">>="](freeBind)(f)(function (_35) {
              return Prelude["return"](freeApplicative)(k(_35));
          });
      };
  });
  var freeBind = new Prelude.Bind(function () {
      return freeApply;
  }, function (_1) {
      return function (k) {
          return new Free(_1.value0, Data_CatList.snoc(_1.value1)(Unsafe_Coerce.unsafeCoerce(k)));
      };
  });
  var freeApply = new Prelude.Apply(function () {
      return freeFunctor;
  }, Prelude.ap(freeMonad));
  var freeApplicative = new Prelude.Applicative(function () {
      return freeApply;
  }, function (_36) {
      return fromView(Return.create(_36));
  });
  var liftF = function (f) {
      return fromView(new Bind(Unsafe_Coerce.unsafeCoerce(f), function (_37) {
          return Prelude.pure(freeApplicative)(Unsafe_Coerce.unsafeCoerce(_37));
      }));
  };
  exports["runFreeM"] = runFreeM;
  exports["liftF"] = liftF;
  exports["freeFunctor"] = freeFunctor;
  exports["freeBind"] = freeBind;
  exports["freeApplicative"] = freeApplicative;
  exports["freeApply"] = freeApply;
  exports["freeMonad"] = freeMonad;;
 
})(PS["Control.Monad.Free"] = PS["Control.Monad.Free"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_State_Class = PS["Control.Monad.State.Class"];
  var Control_Monad_State_Trans = PS["Control.Monad.State.Trans"];
  var Data_Identity = PS["Data.Identity"];
  var Data_Tuple = PS["Data.Tuple"];                   
  var runState = function (s) {
      return function (_0) {
          return Data_Identity.runIdentity(Control_Monad_State_Trans.runStateT(s)(_0));
      };
  };
  exports["runState"] = runState;;
 
})(PS["Control.Monad.State"] = PS["Control.Monad.State"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Writer_Class = PS["Control.Monad.Writer.Class"];
  var Control_Monad_Writer_Trans = PS["Control.Monad.Writer.Trans"];
  var Data_Identity = PS["Data.Identity"];
  var Data_Tuple = PS["Data.Tuple"];     
  var runWriter = function (_0) {
      return Data_Identity.runIdentity(Control_Monad_Writer_Trans.runWriterT(_0));
  };
  exports["runWriter"] = runWriter;;
 
})(PS["Control.Monad.Writer"] = PS["Control.Monad.Writer"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module DOM.Event.EventTarget

  exports.eventListener = function (fn) {
    return function (event) {
      return fn(event)();
    };
  };

  exports.addEventListener = function (type) {
    return function (listener) {
      return function (useCapture) {
        return function (target) {
          return function () {
            target.addEventListener(type, listener, useCapture);
            return {};
          };
        };
      };
    };
  };
 
})(PS["DOM.Event.EventTarget"] = PS["DOM.Event.EventTarget"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["DOM.Event.EventTarget"];
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var DOM = PS["DOM"];
  var DOM_Event_Types = PS["DOM.Event.Types"];
  exports["addEventListener"] = $foreign.addEventListener;
  exports["eventListener"] = $foreign.eventListener;;
 
})(PS["DOM.Event.EventTarget"] = PS["DOM.Event.EventTarget"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var DOM_Event_Types = PS["DOM.Event.Types"];
  var load = "load";
  exports["load"] = load;;
 
})(PS["DOM.Event.EventTypes"] = PS["DOM.Event.EventTypes"] || {});
(function(exports) {
  /* global exports, window */
  "use strict";

  // module DOM.HTML

  exports.window = function () {
    return window;
  };
 
})(PS["DOM.HTML"] = PS["DOM.HTML"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Foreign

  // jshint maxparams: 3
  exports.parseJSONImpl = function (left, right, str) {
    try {
      return right(JSON.parse(str));
    } catch (e) {
      return left(e.toString());
    }
  };

  // jshint maxparams: 1
  exports.toForeign = function (value) {
    return value;
  };

  exports.unsafeFromForeign = function (value) {
    return value;
  };

  exports.typeOf = function (value) {
    return typeof value;
  };

  exports.tagOf = function (value) {
    return Object.prototype.toString.call(value).slice(8, -1);
  };

  exports.isNull = function (value) {
    return value === null;
  };

  exports.isUndefined = function (value) {
    return value === undefined;
  };
 
})(PS["Data.Foreign"] = PS["Data.Foreign"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Foreign"];
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Function = PS["Data.Function"];
  var Data_Int = PS["Data.Int"];
  var Data_String = PS["Data.String"];     
  var TypeMismatch = (function () {
      function TypeMismatch(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      TypeMismatch.create = function (value0) {
          return function (value1) {
              return new TypeMismatch(value0, value1);
          };
      };
      return TypeMismatch;
  })();
  var ErrorAtIndex = (function () {
      function ErrorAtIndex(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      ErrorAtIndex.create = function (value0) {
          return function (value1) {
              return new ErrorAtIndex(value0, value1);
          };
      };
      return ErrorAtIndex;
  })();
  var ErrorAtProperty = (function () {
      function ErrorAtProperty(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      ErrorAtProperty.create = function (value0) {
          return function (value1) {
              return new ErrorAtProperty(value0, value1);
          };
      };
      return ErrorAtProperty;
  })();
  var JSONError = (function () {
      function JSONError(value0) {
          this.value0 = value0;
      };
      JSONError.create = function (value0) {
          return new JSONError(value0);
      };
      return JSONError;
  })();
  var unsafeReadTagged = function (tag) {
      return function (value) {
          if (Prelude["=="](Prelude.eqString)($foreign.tagOf(value))(tag)) {
              return Prelude.pure(Data_Either.applicativeEither)($foreign.unsafeFromForeign(value));
          };
          return new Data_Either.Left(new TypeMismatch(tag, $foreign.tagOf(value)));
      };
  };
  var showForeignError = new Prelude.Show(function (_0) {
      if (_0 instanceof TypeMismatch) {
          return "Type mismatch: expected " + (_0.value0 + (", found " + _0.value1));
      };
      if (_0 instanceof ErrorAtIndex) {
          return "Error at array index " + (Prelude.show(Prelude.showInt)(_0.value0) + (": " + Prelude.show(showForeignError)(_0.value1)));
      };
      if (_0 instanceof ErrorAtProperty) {
          return "Error at property " + (Prelude.show(Prelude.showString)(_0.value0) + (": " + Prelude.show(showForeignError)(_0.value1)));
      };
      if (_0 instanceof JSONError) {
          return "JSON error: " + _0.value0;
      };
      throw new Error("Failed pattern match: " + [ _0.constructor.name ]);
  });
  var readString = unsafeReadTagged("String");
  var parseJSON = function (json) {
      return $foreign.parseJSONImpl(function (_32) {
          return Data_Either.Left.create(JSONError.create(_32));
      }, Data_Either.Right.create, json);
  };
  exports["TypeMismatch"] = TypeMismatch;
  exports["ErrorAtIndex"] = ErrorAtIndex;
  exports["ErrorAtProperty"] = ErrorAtProperty;
  exports["JSONError"] = JSONError;
  exports["readString"] = readString;
  exports["unsafeReadTagged"] = unsafeReadTagged;
  exports["parseJSON"] = parseJSON;
  exports["showForeignError"] = showForeignError;
  exports["isUndefined"] = $foreign.isUndefined;
  exports["isNull"] = $foreign.isNull;
  exports["typeOf"] = $foreign.typeOf;
  exports["toForeign"] = $foreign.toForeign;;
 
})(PS["Data.Foreign"] = PS["Data.Foreign"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Foreign.Index

  // jshint maxparams: 4
  exports.unsafeReadPropImpl = function (f, s, key, value) {
    return value == null ? f : s(value[key]);
  };

  // jshint maxparams: 2
  exports.unsafeHasOwnProperty = function (prop, value) {
    return Object.prototype.hasOwnProperty.call(value, prop);
  };

  exports.unsafeHasProperty = function (prop, value) {
    return prop in value;
  };
 
})(PS["Data.Foreign.Index"] = PS["Data.Foreign.Index"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Foreign.Index"];
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Function = PS["Data.Function"];
  var Data_Int = PS["Data.Int"];     
  var Index = function (errorAt, hasOwnProperty, hasProperty, ix) {
      this.errorAt = errorAt;
      this.hasOwnProperty = hasOwnProperty;
      this.hasProperty = hasProperty;
      this.ix = ix;
  };
  var unsafeReadProp = function (k) {
      return function (value) {
          return $foreign.unsafeReadPropImpl(new Data_Either.Left(new Data_Foreign.TypeMismatch("object", Data_Foreign.typeOf(value))), Prelude.pure(Data_Either.applicativeEither), k, value);
      };
  };
  var prop = unsafeReadProp;
  var ix = function (dict) {
      return dict.ix;
  };
  var $bang = function (__dict_Index_0) {
      return ix(__dict_Index_0);
  };                         
  var hasPropertyImpl = function (p) {
      return function (value) {
          if (Data_Foreign.isNull(value)) {
              return false;
          };
          if (Data_Foreign.isUndefined(value)) {
              return false;
          };
          if (Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("object") || Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("function")) {
              return $foreign.unsafeHasProperty(p, value);
          };
          return false;
      };
  };
  var hasProperty = function (dict) {
      return dict.hasProperty;
  };
  var hasOwnPropertyImpl = function (p) {
      return function (value) {
          if (Data_Foreign.isNull(value)) {
              return false;
          };
          if (Data_Foreign.isUndefined(value)) {
              return false;
          };
          if (Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("object") || Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("function")) {
              return $foreign.unsafeHasOwnProperty(p, value);
          };
          return false;
      };
  };                                                                                                                   
  var indexString = new Index(Data_Foreign.ErrorAtProperty.create, hasOwnPropertyImpl, hasPropertyImpl, Prelude.flip(prop));
  var hasOwnProperty = function (dict) {
      return dict.hasOwnProperty;
  };
  var errorAt = function (dict) {
      return dict.errorAt;
  };
  exports["Index"] = Index;
  exports["errorAt"] = errorAt;
  exports["hasOwnProperty"] = hasOwnProperty;
  exports["hasProperty"] = hasProperty;
  exports["!"] = $bang;
  exports["ix"] = ix;
  exports["prop"] = prop;
  exports["indexString"] = indexString;;
 
})(PS["Data.Foreign.Index"] = PS["Data.Foreign.Index"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Array = PS["Data.Array"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Index = PS["Data.Foreign.Index"];
  var Data_Foreign_Null = PS["Data.Foreign.Null"];
  var Data_Foreign_NullOrUndefined = PS["Data.Foreign.NullOrUndefined"];
  var Data_Foreign_Undefined = PS["Data.Foreign.Undefined"];
  var Data_Int = PS["Data.Int"];
  var Data_Traversable = PS["Data.Traversable"];     
  var IsForeign = function (read) {
      this.read = read;
  };
  var stringIsForeign = new IsForeign(Data_Foreign.readString);
  var read = function (dict) {
      return dict.read;
  };
  var readWith = function (__dict_IsForeign_1) {
      return function (f) {
          return function (value) {
              return Data_Either.either(function (_0) {
                  return Data_Either.Left.create(f(_0));
              })(Data_Either.Right.create)(read(__dict_IsForeign_1)(value));
          };
      };
  };
  var readProp = function (__dict_IsForeign_2) {
      return function (__dict_Index_3) {
          return function (prop) {
              return function (value) {
                  return Prelude[">>="](Data_Either.bindEither)(Data_Foreign_Index["!"](__dict_Index_3)(value)(prop))(readWith(__dict_IsForeign_2)(Data_Foreign_Index.errorAt(__dict_Index_3)(prop)));
              };
          };
      };
  };
  exports["IsForeign"] = IsForeign;
  exports["readProp"] = readProp;
  exports["readWith"] = readWith;
  exports["read"] = read;
  exports["stringIsForeign"] = stringIsForeign;;
 
})(PS["Data.Foreign.Class"] = PS["Data.Foreign.Class"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var DOM_Event_Types = PS["DOM.Event.Types"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];                           
  var elementToNode = Unsafe_Coerce.unsafeCoerce;
  exports["elementToNode"] = elementToNode;;
 
})(PS["DOM.Node.Types"] = PS["DOM.Node.Types"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["DOM.HTML.Types"];
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Class = PS["Data.Foreign.Class"];
  var DOM_Event_Types = PS["DOM.Event.Types"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];     
  var windowToEventTarget = Unsafe_Coerce.unsafeCoerce;                  
  var htmlElementToNode = Unsafe_Coerce.unsafeCoerce;   
  var htmlDocumentToParentNode = Unsafe_Coerce.unsafeCoerce;
  exports["htmlElementToNode"] = htmlElementToNode;
  exports["htmlDocumentToParentNode"] = htmlDocumentToParentNode;
  exports["windowToEventTarget"] = windowToEventTarget;;
 
})(PS["DOM.HTML.Types"] = PS["DOM.HTML.Types"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["DOM.HTML"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var DOM = PS["DOM"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  exports["window"] = $foreign.window;;
 
})(PS["DOM.HTML"] = PS["DOM.HTML"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module DOM.HTML.Window

  exports.document = function (window) {
    return function () {
      return window.document;
    };
  };
 
})(PS["DOM.HTML.Window"] = PS["DOM.HTML.Window"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["DOM.HTML.Window"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var DOM = PS["DOM"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  exports["document"] = $foreign.document;;
 
})(PS["DOM.HTML.Window"] = PS["DOM.HTML.Window"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.appendChild = function (node) {
    return function (parent) {
      return function () {
        return parent.appendChild(node);
      };
    };
  };
 
})(PS["DOM.Node.Node"] = PS["DOM.Node.Node"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Nullable

  exports["null"] = null;

  exports.nullable = function(a, r, f) {
      return a == null ? r : f(a);
  };

  exports.notNull = function(x) {
      return x;
  }; 
 
})(PS["Data.Nullable"] = PS["Data.Nullable"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Nullable"];
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Function = PS["Data.Function"];     
  var toNullable = Data_Maybe.maybe($foreign["null"])($foreign.notNull);
  var toMaybe = function (n) {
      return $foreign.nullable(n, Data_Maybe.Nothing.value, Data_Maybe.Just.create);
  };
  exports["toNullable"] = toNullable;
  exports["toMaybe"] = toMaybe;;
 
})(PS["Data.Nullable"] = PS["Data.Nullable"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Maybe.Unsafe

  exports.unsafeThrow = function (msg) {
    throw new Error(msg);
  };
 
})(PS["Data.Maybe.Unsafe"] = PS["Data.Maybe.Unsafe"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Data.Maybe.Unsafe"];
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  exports["unsafeThrow"] = $foreign.unsafeThrow;;
 
})(PS["Data.Maybe.Unsafe"] = PS["Data.Maybe.Unsafe"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["DOM.Node.Node"];
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Data_Enum = PS["Data.Enum"];
  var Data_Nullable = PS["Data.Nullable"];
  var Data_Maybe_Unsafe = PS["Data.Maybe.Unsafe"];
  var DOM = PS["DOM"];
  var DOM_Node_NodeType = PS["DOM.Node.NodeType"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  exports["appendChild"] = $foreign.appendChild;;
 
})(PS["DOM.Node.Node"] = PS["DOM.Node.Node"] || {});
(function(exports) {
  /* global exports */
  "use strict";                                               

  exports.querySelector = function (selector) {
    return function (node) {
      return function () {
        return node.querySelector(selector);
      };
    };
  };
 
})(PS["DOM.Node.ParentNode"] = PS["DOM.Node.ParentNode"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["DOM.Node.ParentNode"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Data_Nullable = PS["Data.Nullable"];
  var DOM = PS["DOM"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  exports["querySelector"] = $foreign.querySelector;;
 
})(PS["DOM.Node.ParentNode"] = PS["DOM.Node.ParentNode"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Unsafe_Coerce = PS["Unsafe.Coerce"];     
  var runExistsR = Unsafe_Coerce.unsafeCoerce;
  var mkExistsR = Unsafe_Coerce.unsafeCoerce;
  exports["runExistsR"] = runExistsR;
  exports["mkExistsR"] = mkExistsR;;
 
})(PS["Data.ExistsR"] = PS["Data.ExistsR"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Traversable = PS["Data.Traversable"];     
  var Coproduct = function (x) {
      return x;
  };
  var right = function (_2) {
      return Coproduct(Data_Either.Right.create(_2));
  };
  var left = function (_3) {
      return Coproduct(Data_Either.Left.create(_3));
  };
  exports["Coproduct"] = Coproduct;
  exports["right"] = right;
  exports["left"] = left;;
 
})(PS["Data.Functor.Coproduct"] = PS["Data.Functor.Coproduct"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_List = PS["Data.List"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_Unsafe = PS["Data.Maybe.Unsafe"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];
  var Data_Tuple = PS["Data.Tuple"];     
  var Leaf = (function () {
      function Leaf() {

      };
      Leaf.value = new Leaf();
      return Leaf;
  })();
  var Two = (function () {
      function Two(value0, value1, value2, value3) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
      };
      Two.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return new Two(value0, value1, value2, value3);
                  };
              };
          };
      };
      return Two;
  })();
  var Three = (function () {
      function Three(value0, value1, value2, value3, value4, value5, value6) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
          this.value4 = value4;
          this.value5 = value5;
          this.value6 = value6;
      };
      Three.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return function (value4) {
                          return function (value5) {
                              return function (value6) {
                                  return new Three(value0, value1, value2, value3, value4, value5, value6);
                              };
                          };
                      };
                  };
              };
          };
      };
      return Three;
  })();
  var TwoLeft = (function () {
      function TwoLeft(value0, value1, value2) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
      };
      TwoLeft.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return new TwoLeft(value0, value1, value2);
              };
          };
      };
      return TwoLeft;
  })();
  var TwoRight = (function () {
      function TwoRight(value0, value1, value2) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
      };
      TwoRight.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return new TwoRight(value0, value1, value2);
              };
          };
      };
      return TwoRight;
  })();
  var ThreeLeft = (function () {
      function ThreeLeft(value0, value1, value2, value3, value4, value5) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
          this.value4 = value4;
          this.value5 = value5;
      };
      ThreeLeft.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return function (value4) {
                          return function (value5) {
                              return new ThreeLeft(value0, value1, value2, value3, value4, value5);
                          };
                      };
                  };
              };
          };
      };
      return ThreeLeft;
  })();
  var ThreeMiddle = (function () {
      function ThreeMiddle(value0, value1, value2, value3, value4, value5) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
          this.value4 = value4;
          this.value5 = value5;
      };
      ThreeMiddle.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return function (value4) {
                          return function (value5) {
                              return new ThreeMiddle(value0, value1, value2, value3, value4, value5);
                          };
                      };
                  };
              };
          };
      };
      return ThreeMiddle;
  })();
  var ThreeRight = (function () {
      function ThreeRight(value0, value1, value2, value3, value4, value5) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
          this.value4 = value4;
          this.value5 = value5;
      };
      ThreeRight.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return function (value4) {
                          return function (value5) {
                              return new ThreeRight(value0, value1, value2, value3, value4, value5);
                          };
                      };
                  };
              };
          };
      };
      return ThreeRight;
  })();
  var KickUp = (function () {
      function KickUp(value0, value1, value2, value3) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
      };
      KickUp.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return new KickUp(value0, value1, value2, value3);
                  };
              };
          };
      };
      return KickUp;
  })();
  var lookup = function (__copy___dict_Ord_6) {
      return function (__copy_k) {
          return function (__copy__4) {
              var __dict_Ord_6 = __copy___dict_Ord_6;
              var k = __copy_k;
              var _4 = __copy__4;
              tco: while (true) {
                  if (_4 instanceof Leaf) {
                      return Data_Maybe.Nothing.value;
                  };
                  var k_1 = k;
                  if (_4 instanceof Two && Prelude["=="](__dict_Ord_6["__superclass_Prelude.Eq_0"]())(k_1)(_4.value1)) {
                      return new Data_Maybe.Just(_4.value2);
                  };
                  var k_1 = k;
                  if (_4 instanceof Two && Prelude["<"](__dict_Ord_6)(k_1)(_4.value1)) {
                      var __tco___dict_Ord_6 = __dict_Ord_6;
                      var __tco__4 = _4.value0;
                      __dict_Ord_6 = __tco___dict_Ord_6;
                      k = k_1;
                      _4 = __tco__4;
                      continue tco;
                  };
                  var k_1 = k;
                  if (_4 instanceof Two) {
                      var __tco___dict_Ord_6 = __dict_Ord_6;
                      var __tco__4 = _4.value3;
                      __dict_Ord_6 = __tco___dict_Ord_6;
                      k = k_1;
                      _4 = __tco__4;
                      continue tco;
                  };
                  var k_1 = k;
                  if (_4 instanceof Three && Prelude["=="](__dict_Ord_6["__superclass_Prelude.Eq_0"]())(k_1)(_4.value1)) {
                      return new Data_Maybe.Just(_4.value2);
                  };
                  var k_1 = k;
                  if (_4 instanceof Three && Prelude["=="](__dict_Ord_6["__superclass_Prelude.Eq_0"]())(k_1)(_4.value4)) {
                      return new Data_Maybe.Just(_4.value5);
                  };
                  var k_1 = k;
                  if (_4 instanceof Three && Prelude["<"](__dict_Ord_6)(k_1)(_4.value1)) {
                      var __tco___dict_Ord_6 = __dict_Ord_6;
                      var __tco__4 = _4.value0;
                      __dict_Ord_6 = __tco___dict_Ord_6;
                      k = k_1;
                      _4 = __tco__4;
                      continue tco;
                  };
                  var k_1 = k;
                  if (_4 instanceof Three && (Prelude["<"](__dict_Ord_6)(_4.value1)(k_1) && Prelude["<="](__dict_Ord_6)(k_1)(_4.value4))) {
                      var __tco___dict_Ord_6 = __dict_Ord_6;
                      var __tco__4 = _4.value3;
                      __dict_Ord_6 = __tco___dict_Ord_6;
                      k = k_1;
                      _4 = __tco__4;
                      continue tco;
                  };
                  if (_4 instanceof Three) {
                      var __tco___dict_Ord_6 = __dict_Ord_6;
                      var __tco_k = k;
                      var __tco__4 = _4.value6;
                      __dict_Ord_6 = __tco___dict_Ord_6;
                      k = __tco_k;
                      _4 = __tco__4;
                      continue tco;
                  };
                  throw new Error("Failed pattern match: " + [ k.constructor.name, _4.constructor.name ]);
              };
          };
      };
  }; 
  var fromZipper = function (__copy___dict_Ord_8) {
      return function (__copy__5) {
          return function (__copy__6) {
              var __dict_Ord_8 = __copy___dict_Ord_8;
              var _5 = __copy__5;
              var _6 = __copy__6;
              tco: while (true) {
                  if (_5 instanceof Data_List.Nil) {
                      return _6;
                  };
                  if (_5 instanceof Data_List.Cons && _5.value0 instanceof TwoLeft) {
                      var __tco___dict_Ord_8 = __dict_Ord_8;
                      var __tco__5 = _5.value1;
                      var __tco__6 = new Two(_6, _5.value0.value0, _5.value0.value1, _5.value0.value2);
                      __dict_Ord_8 = __tco___dict_Ord_8;
                      _5 = __tco__5;
                      _6 = __tco__6;
                      continue tco;
                  };
                  if (_5 instanceof Data_List.Cons && _5.value0 instanceof TwoRight) {
                      var __tco___dict_Ord_8 = __dict_Ord_8;
                      var __tco__5 = _5.value1;
                      var __tco__6 = new Two(_5.value0.value0, _5.value0.value1, _5.value0.value2, _6);
                      __dict_Ord_8 = __tco___dict_Ord_8;
                      _5 = __tco__5;
                      _6 = __tco__6;
                      continue tco;
                  };
                  if (_5 instanceof Data_List.Cons && _5.value0 instanceof ThreeLeft) {
                      var __tco___dict_Ord_8 = __dict_Ord_8;
                      var __tco__5 = _5.value1;
                      var __tco__6 = new Three(_6, _5.value0.value0, _5.value0.value1, _5.value0.value2, _5.value0.value3, _5.value0.value4, _5.value0.value5);
                      __dict_Ord_8 = __tco___dict_Ord_8;
                      _5 = __tco__5;
                      _6 = __tco__6;
                      continue tco;
                  };
                  if (_5 instanceof Data_List.Cons && _5.value0 instanceof ThreeMiddle) {
                      var __tco___dict_Ord_8 = __dict_Ord_8;
                      var __tco__5 = _5.value1;
                      var __tco__6 = new Three(_5.value0.value0, _5.value0.value1, _5.value0.value2, _6, _5.value0.value3, _5.value0.value4, _5.value0.value5);
                      __dict_Ord_8 = __tco___dict_Ord_8;
                      _5 = __tco__5;
                      _6 = __tco__6;
                      continue tco;
                  };
                  if (_5 instanceof Data_List.Cons && _5.value0 instanceof ThreeRight) {
                      var __tco___dict_Ord_8 = __dict_Ord_8;
                      var __tco__5 = _5.value1;
                      var __tco__6 = new Three(_5.value0.value0, _5.value0.value1, _5.value0.value2, _5.value0.value3, _5.value0.value4, _5.value0.value5, _6);
                      __dict_Ord_8 = __tco___dict_Ord_8;
                      _5 = __tco__5;
                      _6 = __tco__6;
                      continue tco;
                  };
                  throw new Error("Failed pattern match: " + [ _5.constructor.name, _6.constructor.name ]);
              };
          };
      };
  };
  var insert = function (__dict_Ord_9) {
      var up = function (__copy__13) {
          return function (__copy__14) {
              var _13 = __copy__13;
              var _14 = __copy__14;
              tco: while (true) {
                  if (_13 instanceof Data_List.Nil) {
                      return new Two(_14.value0, _14.value1, _14.value2, _14.value3);
                  };
                  if (_13 instanceof Data_List.Cons && _13.value0 instanceof TwoLeft) {
                      return fromZipper(__dict_Ord_9)(_13.value1)(new Three(_14.value0, _14.value1, _14.value2, _14.value3, _13.value0.value0, _13.value0.value1, _13.value0.value2));
                  };
                  if (_13 instanceof Data_List.Cons && _13.value0 instanceof TwoRight) {
                      return fromZipper(__dict_Ord_9)(_13.value1)(new Three(_13.value0.value0, _13.value0.value1, _13.value0.value2, _14.value0, _14.value1, _14.value2, _14.value3));
                  };
                  if (_13 instanceof Data_List.Cons && _13.value0 instanceof ThreeLeft) {
                      var __tco__13 = _13.value1;
                      var __tco__14 = new KickUp(new Two(_14.value0, _14.value1, _14.value2, _14.value3), _13.value0.value0, _13.value0.value1, new Two(_13.value0.value2, _13.value0.value3, _13.value0.value4, _13.value0.value5));
                      _13 = __tco__13;
                      _14 = __tco__14;
                      continue tco;
                  };
                  if (_13 instanceof Data_List.Cons && _13.value0 instanceof ThreeMiddle) {
                      var __tco__13 = _13.value1;
                      var __tco__14 = new KickUp(new Two(_13.value0.value0, _13.value0.value1, _13.value0.value2, _14.value0), _14.value1, _14.value2, new Two(_14.value3, _13.value0.value3, _13.value0.value4, _13.value0.value5));
                      _13 = __tco__13;
                      _14 = __tco__14;
                      continue tco;
                  };
                  if (_13 instanceof Data_List.Cons && _13.value0 instanceof ThreeRight) {
                      var __tco__13 = _13.value1;
                      var __tco__14 = new KickUp(new Two(_13.value0.value0, _13.value0.value1, _13.value0.value2, _13.value0.value3), _13.value0.value4, _13.value0.value5, new Two(_14.value0, _14.value1, _14.value2, _14.value3));
                      _13 = __tco__13;
                      _14 = __tco__14;
                      continue tco;
                  };
                  throw new Error("Failed pattern match at Data.Map line 148, column 1 - line 149, column 1: " + [ _13.constructor.name, _14.constructor.name ]);
              };
          };
      };
      var down = function (__copy_ctx) {
          return function (__copy_k) {
              return function (__copy_v) {
                  return function (__copy__12) {
                      var ctx = __copy_ctx;
                      var k = __copy_k;
                      var v = __copy_v;
                      var _12 = __copy__12;
                      tco: while (true) {
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Leaf) {
                              return up(ctx_1)(new KickUp(Leaf.value, k_1, v_1, Leaf.value));
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Two && Prelude["=="](__dict_Ord_9["__superclass_Prelude.Eq_0"]())(k_1)(_12.value1)) {
                              return fromZipper(__dict_Ord_9)(ctx_1)(new Two(_12.value0, k_1, v_1, _12.value3));
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Two && Prelude["<"](__dict_Ord_9)(k_1)(_12.value1)) {
                              var __tco_ctx = new Data_List.Cons(new TwoLeft(_12.value1, _12.value2, _12.value3), ctx_1);
                              var __tco__12 = _12.value0;
                              ctx = __tco_ctx;
                              k = k_1;
                              v = v_1;
                              _12 = __tco__12;
                              continue tco;
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Two) {
                              var __tco_ctx = new Data_List.Cons(new TwoRight(_12.value0, _12.value1, _12.value2), ctx_1);
                              var __tco__12 = _12.value3;
                              ctx = __tco_ctx;
                              k = k_1;
                              v = v_1;
                              _12 = __tco__12;
                              continue tco;
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Three && Prelude["=="](__dict_Ord_9["__superclass_Prelude.Eq_0"]())(k_1)(_12.value1)) {
                              return fromZipper(__dict_Ord_9)(ctx_1)(new Three(_12.value0, k_1, v_1, _12.value3, _12.value4, _12.value5, _12.value6));
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Three && Prelude["=="](__dict_Ord_9["__superclass_Prelude.Eq_0"]())(k_1)(_12.value4)) {
                              return fromZipper(__dict_Ord_9)(ctx_1)(new Three(_12.value0, _12.value1, _12.value2, _12.value3, k_1, v_1, _12.value6));
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Three && Prelude["<"](__dict_Ord_9)(k_1)(_12.value1)) {
                              var __tco_ctx = new Data_List.Cons(new ThreeLeft(_12.value1, _12.value2, _12.value3, _12.value4, _12.value5, _12.value6), ctx_1);
                              var __tco__12 = _12.value0;
                              ctx = __tco_ctx;
                              k = k_1;
                              v = v_1;
                              _12 = __tco__12;
                              continue tco;
                          };
                          var ctx_1 = ctx;
                          var k_1 = k;
                          var v_1 = v;
                          if (_12 instanceof Three && (Prelude["<"](__dict_Ord_9)(_12.value1)(k_1) && Prelude["<="](__dict_Ord_9)(k_1)(_12.value4))) {
                              var __tco_ctx = new Data_List.Cons(new ThreeMiddle(_12.value0, _12.value1, _12.value2, _12.value4, _12.value5, _12.value6), ctx_1);
                              var __tco__12 = _12.value3;
                              ctx = __tco_ctx;
                              k = k_1;
                              v = v_1;
                              _12 = __tco__12;
                              continue tco;
                          };
                          if (_12 instanceof Three) {
                              var __tco_ctx = new Data_List.Cons(new ThreeRight(_12.value0, _12.value1, _12.value2, _12.value3, _12.value4, _12.value5), ctx);
                              var __tco_k = k;
                              var __tco_v = v;
                              var __tco__12 = _12.value6;
                              ctx = __tco_ctx;
                              k = __tco_k;
                              v = __tco_v;
                              _12 = __tco__12;
                              continue tco;
                          };
                          throw new Error("Failed pattern match at Data.Map line 148, column 1 - line 149, column 1: " + [ ctx.constructor.name, k.constructor.name, v.constructor.name, _12.constructor.name ]);
                      };
                  };
              };
          };
      };
      return down(Data_List.Nil.value);
  };
  var empty = Leaf.value;
  var $$delete = function (__dict_Ord_15) {
      var up = function (__copy__16) {
          return function (__copy__17) {
              var _16 = __copy__16;
              var _17 = __copy__17;
              tco: while (true) {
                  if (_16 instanceof Data_List.Nil) {
                      return _17;
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof TwoLeft && (_16.value0.value2 instanceof Leaf && _17 instanceof Leaf))) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(Leaf.value, _16.value0.value0, _16.value0.value1, Leaf.value));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof TwoRight && (_16.value0.value0 instanceof Leaf && _17 instanceof Leaf))) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(Leaf.value, _16.value0.value1, _16.value0.value2, Leaf.value));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof TwoLeft && _16.value0.value2 instanceof Two)) {
                      var __tco__16 = _16.value1;
                      var __tco__17 = new Three(_17, _16.value0.value0, _16.value0.value1, _16.value0.value2.value0, _16.value0.value2.value1, _16.value0.value2.value2, _16.value0.value2.value3);
                      _16 = __tco__16;
                      _17 = __tco__17;
                      continue tco;
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof TwoRight && _16.value0.value0 instanceof Two)) {
                      var __tco__16 = _16.value1;
                      var __tco__17 = new Three(_16.value0.value0.value0, _16.value0.value0.value1, _16.value0.value0.value2, _16.value0.value0.value3, _16.value0.value1, _16.value0.value2, _17);
                      _16 = __tco__16;
                      _17 = __tco__17;
                      continue tco;
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof TwoLeft && _16.value0.value2 instanceof Three)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(new Two(_17, _16.value0.value0, _16.value0.value1, _16.value0.value2.value0), _16.value0.value2.value1, _16.value0.value2.value2, new Two(_16.value0.value2.value3, _16.value0.value2.value4, _16.value0.value2.value5, _16.value0.value2.value6)));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof TwoRight && _16.value0.value0 instanceof Three)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(new Two(_16.value0.value0.value0, _16.value0.value0.value1, _16.value0.value0.value2, _16.value0.value0.value3), _16.value0.value0.value4, _16.value0.value0.value5, new Two(_16.value0.value0.value6, _16.value0.value1, _16.value0.value2, _17)));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeLeft && (_16.value0.value2 instanceof Leaf && (_16.value0.value5 instanceof Leaf && _17 instanceof Leaf)))) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(Leaf.value, _16.value0.value0, _16.value0.value1, Leaf.value, _16.value0.value3, _16.value0.value4, Leaf.value));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeMiddle && (_16.value0.value0 instanceof Leaf && (_16.value0.value5 instanceof Leaf && _17 instanceof Leaf)))) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(Leaf.value, _16.value0.value1, _16.value0.value2, Leaf.value, _16.value0.value3, _16.value0.value4, Leaf.value));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeRight && (_16.value0.value0 instanceof Leaf && (_16.value0.value3 instanceof Leaf && _17 instanceof Leaf)))) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(Leaf.value, _16.value0.value1, _16.value0.value2, Leaf.value, _16.value0.value4, _16.value0.value5, Leaf.value));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeLeft && _16.value0.value2 instanceof Two)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(new Three(_17, _16.value0.value0, _16.value0.value1, _16.value0.value2.value0, _16.value0.value2.value1, _16.value0.value2.value2, _16.value0.value2.value3), _16.value0.value3, _16.value0.value4, _16.value0.value5));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeMiddle && _16.value0.value0 instanceof Two)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(new Three(_16.value0.value0.value0, _16.value0.value0.value1, _16.value0.value0.value2, _16.value0.value0.value3, _16.value0.value1, _16.value0.value2, _17), _16.value0.value3, _16.value0.value4, _16.value0.value5));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeMiddle && _16.value0.value5 instanceof Two)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(_16.value0.value0, _16.value0.value1, _16.value0.value2, new Three(_17, _16.value0.value3, _16.value0.value4, _16.value0.value5.value0, _16.value0.value5.value1, _16.value0.value5.value2, _16.value0.value5.value3)));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeRight && _16.value0.value3 instanceof Two)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Two(_16.value0.value0, _16.value0.value1, _16.value0.value2, new Three(_16.value0.value3.value0, _16.value0.value3.value1, _16.value0.value3.value2, _16.value0.value3.value3, _16.value0.value4, _16.value0.value5, _17)));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeLeft && _16.value0.value2 instanceof Three)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(new Two(_17, _16.value0.value0, _16.value0.value1, _16.value0.value2.value0), _16.value0.value2.value1, _16.value0.value2.value2, new Two(_16.value0.value2.value3, _16.value0.value2.value4, _16.value0.value2.value5, _16.value0.value2.value6), _16.value0.value3, _16.value0.value4, _16.value0.value5));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeMiddle && _16.value0.value0 instanceof Three)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(new Two(_16.value0.value0.value0, _16.value0.value0.value1, _16.value0.value0.value2, _16.value0.value0.value3), _16.value0.value0.value4, _16.value0.value0.value5, new Two(_16.value0.value0.value6, _16.value0.value1, _16.value0.value2, _17), _16.value0.value3, _16.value0.value4, _16.value0.value5));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeMiddle && _16.value0.value5 instanceof Three)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(_16.value0.value0, _16.value0.value1, _16.value0.value2, new Two(_17, _16.value0.value3, _16.value0.value4, _16.value0.value5.value0), _16.value0.value5.value1, _16.value0.value5.value2, new Two(_16.value0.value5.value3, _16.value0.value5.value4, _16.value0.value5.value5, _16.value0.value5.value6)));
                  };
                  if (_16 instanceof Data_List.Cons && (_16.value0 instanceof ThreeRight && _16.value0.value3 instanceof Three)) {
                      return fromZipper(__dict_Ord_15)(_16.value1)(new Three(_16.value0.value0, _16.value0.value1, _16.value0.value2, new Two(_16.value0.value3.value0, _16.value0.value3.value1, _16.value0.value3.value2, _16.value0.value3.value3), _16.value0.value3.value4, _16.value0.value3.value5, new Two(_16.value0.value3.value6, _16.value0.value4, _16.value0.value5, _17)));
                  };
                  return Data_Maybe_Unsafe.unsafeThrow("Impossible case in 'up'");
              };
          };
      };
      var removeMaxNode = function (__copy_ctx) {
          return function (__copy__19) {
              var ctx = __copy_ctx;
              var _19 = __copy__19;
              tco: while (true) {
                  var ctx_1 = ctx;
                  if (_19 instanceof Two && (_19.value0 instanceof Leaf && _19.value3 instanceof Leaf)) {
                      return up(ctx_1)(Leaf.value);
                  };
                  var ctx_1 = ctx;
                  if (_19 instanceof Two) {
                      var __tco_ctx = new Data_List.Cons(new TwoRight(_19.value0, _19.value1, _19.value2), ctx_1);
                      var __tco__19 = _19.value3;
                      ctx = __tco_ctx;
                      _19 = __tco__19;
                      continue tco;
                  };
                  var ctx_1 = ctx;
                  if (_19 instanceof Three && (_19.value0 instanceof Leaf && (_19.value3 instanceof Leaf && _19.value6 instanceof Leaf))) {
                      return up(new Data_List.Cons(new TwoRight(Leaf.value, _19.value1, _19.value2), ctx_1))(Leaf.value);
                  };
                  if (_19 instanceof Three) {
                      var __tco_ctx = new Data_List.Cons(new ThreeRight(_19.value0, _19.value1, _19.value2, _19.value3, _19.value4, _19.value5), ctx);
                      var __tco__19 = _19.value6;
                      ctx = __tco_ctx;
                      _19 = __tco__19;
                      continue tco;
                  };
                  if (_19 instanceof Leaf) {
                      return Data_Maybe_Unsafe.unsafeThrow("Impossible case in 'removeMaxNode'");
                  };
                  throw new Error("Failed pattern match at Data.Map line 171, column 1 - line 172, column 1: " + [ ctx.constructor.name, _19.constructor.name ]);
              };
          };
      };
      var maxNode = function (__copy__18) {
          var _18 = __copy__18;
          tco: while (true) {
              if (_18 instanceof Two && _18.value3 instanceof Leaf) {
                  return {
                      key: _18.value1, 
                      value: _18.value2
                  };
              };
              if (_18 instanceof Two) {
                  var __tco__18 = _18.value3;
                  _18 = __tco__18;
                  continue tco;
              };
              if (_18 instanceof Three && _18.value6 instanceof Leaf) {
                  return {
                      key: _18.value4, 
                      value: _18.value5
                  };
              };
              if (_18 instanceof Three) {
                  var __tco__18 = _18.value6;
                  _18 = __tco__18;
                  continue tco;
              };
              if (_18 instanceof Leaf) {
                  return Data_Maybe_Unsafe.unsafeThrow("Impossible case in 'maxNode'");
              };
              throw new Error("Failed pattern match at Data.Map line 171, column 1 - line 172, column 1: " + [ _18.constructor.name ]);
          };
      };
      var down = function (__copy_ctx) {
          return function (__copy_k) {
              return function (__copy__15) {
                  var ctx = __copy_ctx;
                  var k = __copy_k;
                  var _15 = __copy__15;
                  tco: while (true) {
                      var ctx_1 = ctx;
                      if (_15 instanceof Leaf) {
                          return fromZipper(__dict_Ord_15)(ctx_1)(Leaf.value);
                      };
                      var ctx_1 = ctx;
                      var k_1 = k;
                      if (_15 instanceof Two && (_15.value0 instanceof Leaf && (_15.value3 instanceof Leaf && Prelude["=="](__dict_Ord_15["__superclass_Prelude.Eq_0"]())(k_1)(_15.value1)))) {
                          return up(ctx_1)(Leaf.value);
                      };
                      var ctx_1 = ctx;
                      var k_1 = k;
                      if (_15 instanceof Two) {
                          if (Prelude["=="](__dict_Ord_15["__superclass_Prelude.Eq_0"]())(k_1)(_15.value1)) {
                              var max = maxNode(_15.value0);
                              return removeMaxNode(new Data_List.Cons(new TwoLeft(max.key, max.value, _15.value3), ctx_1))(_15.value0);
                          };
                          if (Prelude["<"](__dict_Ord_15)(k_1)(_15.value1)) {
                              var __tco_ctx = new Data_List.Cons(new TwoLeft(_15.value1, _15.value2, _15.value3), ctx_1);
                              var __tco__15 = _15.value0;
                              ctx = __tco_ctx;
                              k = k_1;
                              _15 = __tco__15;
                              continue tco;
                          };
                          if (Prelude.otherwise) {
                              var __tco_ctx = new Data_List.Cons(new TwoRight(_15.value0, _15.value1, _15.value2), ctx_1);
                              var __tco__15 = _15.value3;
                              ctx = __tco_ctx;
                              k = k_1;
                              _15 = __tco__15;
                              continue tco;
                          };
                      };
                      var ctx_1 = ctx;
                      var k_1 = k;
                      if (_15 instanceof Three && (_15.value0 instanceof Leaf && (_15.value3 instanceof Leaf && _15.value6 instanceof Leaf))) {
                          if (Prelude["=="](__dict_Ord_15["__superclass_Prelude.Eq_0"]())(k_1)(_15.value1)) {
                              return fromZipper(__dict_Ord_15)(ctx_1)(new Two(Leaf.value, _15.value4, _15.value5, Leaf.value));
                          };
                          if (Prelude["=="](__dict_Ord_15["__superclass_Prelude.Eq_0"]())(k_1)(_15.value4)) {
                              return fromZipper(__dict_Ord_15)(ctx_1)(new Two(Leaf.value, _15.value1, _15.value2, Leaf.value));
                          };
                      };
                      if (_15 instanceof Three) {
                          if (Prelude["=="](__dict_Ord_15["__superclass_Prelude.Eq_0"]())(k)(_15.value1)) {
                              var max = maxNode(_15.value0);
                              return removeMaxNode(new Data_List.Cons(new ThreeLeft(max.key, max.value, _15.value3, _15.value4, _15.value5, _15.value6), ctx))(_15.value0);
                          };
                          if (Prelude["=="](__dict_Ord_15["__superclass_Prelude.Eq_0"]())(k)(_15.value4)) {
                              var max = maxNode(_15.value3);
                              return removeMaxNode(new Data_List.Cons(new ThreeMiddle(_15.value0, _15.value1, _15.value2, max.key, max.value, _15.value6), ctx))(_15.value3);
                          };
                          if (Prelude["<"](__dict_Ord_15)(k)(_15.value1)) {
                              var __tco_ctx = new Data_List.Cons(new ThreeLeft(_15.value1, _15.value2, _15.value3, _15.value4, _15.value5, _15.value6), ctx);
                              var __tco_k = k;
                              var __tco__15 = _15.value0;
                              ctx = __tco_ctx;
                              k = __tco_k;
                              _15 = __tco__15;
                              continue tco;
                          };
                          if (Prelude["<"](__dict_Ord_15)(_15.value1)(k) && Prelude["<"](__dict_Ord_15)(k)(_15.value4)) {
                              var __tco_ctx = new Data_List.Cons(new ThreeMiddle(_15.value0, _15.value1, _15.value2, _15.value4, _15.value5, _15.value6), ctx);
                              var __tco_k = k;
                              var __tco__15 = _15.value3;
                              ctx = __tco_ctx;
                              k = __tco_k;
                              _15 = __tco__15;
                              continue tco;
                          };
                          if (Prelude.otherwise) {
                              var __tco_ctx = new Data_List.Cons(new ThreeRight(_15.value0, _15.value1, _15.value2, _15.value3, _15.value4, _15.value5), ctx);
                              var __tco_k = k;
                              var __tco__15 = _15.value6;
                              ctx = __tco_ctx;
                              k = __tco_k;
                              _15 = __tco__15;
                              continue tco;
                          };
                      };
                      throw new Error("Failed pattern match at Data.Map line 171, column 1 - line 172, column 1: " + [ ctx.constructor.name, k.constructor.name, _15.constructor.name ]);
                  };
              };
          };
      };
      return down(Data_List.Nil.value);
  };
  var alter = function (__dict_Ord_16) {
      return function (f) {
          return function (k) {
              return function (m) {
                  var _553 = f(lookup(__dict_Ord_16)(k)(m));
                  if (_553 instanceof Data_Maybe.Nothing) {
                      return $$delete(__dict_Ord_16)(k)(m);
                  };
                  if (_553 instanceof Data_Maybe.Just) {
                      return insert(__dict_Ord_16)(k)(_553.value0)(m);
                  };
                  throw new Error("Failed pattern match at Data.Map line 233, column 1 - line 234, column 1: " + [ _553.constructor.name ]);
              };
          };
      };
  };
  exports["alter"] = alter;
  exports["lookup"] = lookup;
  exports["insert"] = insert;
  exports["empty"] = empty;;
 
})(PS["Data.Map"] = PS["Data.Map"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Halogen.HTML.Events.Handler

  exports.preventDefaultImpl = function (e) {
    return function () {
      e.preventDefault();
    };
  };

  exports.stopPropagationImpl = function (e) {
    return function () {
      e.stopPropagation();
    };
  };

  exports.stopImmediatePropagationImpl = function (e) {
    return function () {
      e.stopImmediatePropagation();
    };
  };
 
})(PS["Halogen.HTML.Events.Handler"] = PS["Halogen.HTML.Events.Handler"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Halogen.HTML.Events.Handler"];
  var Prelude = PS["Prelude"];
  var Control_Apply = PS["Control.Apply"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Writer = PS["Control.Monad.Writer"];
  var Control_Monad_Writer_Class = PS["Control.Monad.Writer.Class"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Tuple = PS["Data.Tuple"];
  var DOM = PS["DOM"];
  var Halogen_HTML_Events_Types = PS["Halogen.HTML.Events.Types"];
  var Data_Monoid = PS["Data.Monoid"];
  var Control_Monad_Writer_Trans = PS["Control.Monad.Writer.Trans"];
  var Data_Identity = PS["Data.Identity"];     
  var PreventDefault = (function () {
      function PreventDefault() {

      };
      PreventDefault.value = new PreventDefault();
      return PreventDefault;
  })();
  var StopPropagation = (function () {
      function StopPropagation() {

      };
      StopPropagation.value = new StopPropagation();
      return StopPropagation;
  })();
  var StopImmediatePropagation = (function () {
      function StopImmediatePropagation() {

      };
      StopImmediatePropagation.value = new StopImmediatePropagation();
      return StopImmediatePropagation;
  })();
  var EventHandler = function (x) {
      return x;
  };                                                                                                                                                                                                                                                                                                                              
  var runEventHandler = function (__dict_Monad_0) {
      return function (__dict_MonadEff_1) {
          return function (e) {
              return function (_1) {
                  var applyUpdate = function (_6) {
                      if (_6 instanceof PreventDefault) {
                          return $foreign.preventDefaultImpl(e);
                      };
                      if (_6 instanceof StopPropagation) {
                          return $foreign.stopPropagationImpl(e);
                      };
                      if (_6 instanceof StopImmediatePropagation) {
                          return $foreign.stopImmediatePropagationImpl(e);
                      };
                      throw new Error("Failed pattern match at Halogen.HTML.Events.Handler line 88, column 3 - line 89, column 3: " + [ _6.constructor.name ]);
                  };
                  var _11 = Control_Monad_Writer.runWriter(_1);
                  return Control_Monad_Eff_Class.liftEff(__dict_MonadEff_1)(Control_Apply["*>"](Control_Monad_Eff.applyEff)(Data_Foldable.for_(Control_Monad_Eff.applicativeEff)(Data_Foldable.foldableArray)(_11.value1)(applyUpdate))(Prelude["return"](Control_Monad_Eff.applicativeEff)(_11.value0)));
              };
          };
      };
  };                                                                                                                                                                                                                                                                                                          
  var functorEventHandler = new Prelude.Functor(function (f) {
      return function (_2) {
          return Prelude["<$>"](Control_Monad_Writer_Trans.functorWriterT(Data_Identity.functorIdentity))(f)(_2);
      };
  });
  var applyEventHandler = new Prelude.Apply(function () {
      return functorEventHandler;
  }, function (_3) {
      return function (_4) {
          return Prelude["<*>"](Control_Monad_Writer_Trans.applyWriterT(Prelude.semigroupArray)(Data_Identity.applyIdentity))(_3)(_4);
      };
  });
  var applicativeEventHandler = new Prelude.Applicative(function () {
      return applyEventHandler;
  }, function (_21) {
      return EventHandler(Prelude.pure(Control_Monad_Writer_Trans.applicativeWriterT(Data_Monoid.monoidArray)(Data_Identity.applicativeIdentity))(_21));
  });
  exports["runEventHandler"] = runEventHandler;
  exports["functorEventHandler"] = functorEventHandler;
  exports["applyEventHandler"] = applyEventHandler;
  exports["applicativeEventHandler"] = applicativeEventHandler;;
 
})(PS["Halogen.HTML.Events.Handler"] = PS["Halogen.HTML.Events.Handler"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Exists = PS["Data.Exists"];
  var Data_ExistsR = PS["Data.ExistsR"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Traversable = PS["Data.Traversable"];
  var Data_Tuple = PS["Data.Tuple"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var Halogen_HTML_Events_Handler = PS["Halogen.HTML.Events.Handler"];
  var Halogen_HTML_Events_Types = PS["Halogen.HTML.Events.Types"];     
  var TagName = function (x) {
      return x;
  };
  var PropName = function (x) {
      return x;
  };
  var EventName = function (x) {
      return x;
  };
  var HandlerF = (function () {
      function HandlerF(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      HandlerF.create = function (value0) {
          return function (value1) {
              return new HandlerF(value0, value1);
          };
      };
      return HandlerF;
  })();
  var AttrName = function (x) {
      return x;
  };
  var PropF = (function () {
      function PropF(value0, value1, value2) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
      };
      PropF.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return new PropF(value0, value1, value2);
              };
          };
      };
      return PropF;
  })();
  var Prop = (function () {
      function Prop(value0) {
          this.value0 = value0;
      };
      Prop.create = function (value0) {
          return new Prop(value0);
      };
      return Prop;
  })();
  var Attr = (function () {
      function Attr(value0, value1, value2) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
      };
      Attr.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return new Attr(value0, value1, value2);
              };
          };
      };
      return Attr;
  })();
  var Key = (function () {
      function Key(value0) {
          this.value0 = value0;
      };
      Key.create = function (value0) {
          return new Key(value0);
      };
      return Key;
  })();
  var Handler = (function () {
      function Handler(value0) {
          this.value0 = value0;
      };
      Handler.create = function (value0) {
          return new Handler(value0);
      };
      return Handler;
  })();
  var Initializer = (function () {
      function Initializer(value0) {
          this.value0 = value0;
      };
      Initializer.create = function (value0) {
          return new Initializer(value0);
      };
      return Initializer;
  })();
  var Finalizer = (function () {
      function Finalizer(value0) {
          this.value0 = value0;
      };
      Finalizer.create = function (value0) {
          return new Finalizer(value0);
      };
      return Finalizer;
  })();
  var Text = (function () {
      function Text(value0) {
          this.value0 = value0;
      };
      Text.create = function (value0) {
          return new Text(value0);
      };
      return Text;
  })();
  var Element = (function () {
      function Element(value0, value1, value2, value3) {
          this.value0 = value0;
          this.value1 = value1;
          this.value2 = value2;
          this.value3 = value3;
      };
      Element.create = function (value0) {
          return function (value1) {
              return function (value2) {
                  return function (value3) {
                      return new Element(value0, value1, value2, value3);
                  };
              };
          };
      };
      return Element;
  })();
  var Slot = (function () {
      function Slot(value0) {
          this.value0 = value0;
      };
      Slot.create = function (value0) {
          return new Slot(value0);
      };
      return Slot;
  })();
  var IsProp = function (toPropString) {
      this.toPropString = toPropString;
  };
  var toPropString = function (dict) {
      return dict.toPropString;
  };
  var tagName = TagName;
  var stringIsProp = new IsProp(function (_10) {
      return function (_11) {
          return function (s) {
              return s;
          };
      };
  });
  var runTagName = function (_3) {
      return _3;
  };
  var runPropName = function (_4) {
      return _4;
  };
  var runNamespace = function (_2) {
      return _2;
  };
  var runEventName = function (_6) {
      return _6;
  };
  var runAttrName = function (_5) {
      return _5;
  };
  var propName = PropName;
  var prop = function (__dict_IsProp_0) {
      return function (name) {
          return function (attr) {
              return function (v) {
                  return new Prop(Data_Exists.mkExists(new PropF(name, v, Prelude["<$>"](Data_Maybe.functorMaybe)(Prelude.flip(Data_Tuple.Tuple.create)(toPropString(__dict_IsProp_0)))(attr))));
              };
          };
      };
  }; 
  var handler$prime = function (name) {
      return function (k) {
          return new Handler(Data_ExistsR.mkExistsR(new HandlerF(name, k)));
      };
  };
  var handler = function (name) {
      return function (k) {
          return new Handler(Data_ExistsR.mkExistsR(new HandlerF(name, function (_56) {
              return Prelude.map(Halogen_HTML_Events_Handler.functorEventHandler)(Data_Maybe.Just.create)(k(_56));
          })));
      };
  };
  var functorProp = new Prelude.Functor(function (f) {
      return function (_9) {
          if (_9 instanceof Prop) {
              return new Prop(_9.value0);
          };
          if (_9 instanceof Key) {
              return new Key(_9.value0);
          };
          if (_9 instanceof Attr) {
              return new Attr(_9.value0, _9.value1, _9.value2);
          };
          if (_9 instanceof Handler) {
              return Data_ExistsR.runExistsR(function (_0) {
                  return new Handler(Data_ExistsR.mkExistsR(new HandlerF(_0.value0, function (_57) {
                      return Prelude.map(Halogen_HTML_Events_Handler.functorEventHandler)(Prelude.map(Data_Maybe.functorMaybe)(f))(_0.value1(_57));
                  })));
              })(_9.value0);
          };
          if (_9 instanceof Initializer) {
              return new Initializer(function (_58) {
                  return f(_9.value0(_58));
              });
          };
          if (_9 instanceof Finalizer) {
              return new Finalizer(function (_59) {
                  return f(_9.value0(_59));
              });
          };
          throw new Error("Failed pattern match at Halogen.HTML.Core line 101, column 1 - line 111, column 1: " + [ f.constructor.name, _9.constructor.name ]);
      };
  });
  var fillSlot = function (__dict_Applicative_1) {
      return function (f) {
          return function (g) {
              return function (_1) {
                  if (_1 instanceof Text) {
                      return Prelude.pure(__dict_Applicative_1)(new Text(_1.value0));
                  };
                  if (_1 instanceof Element) {
                      return Prelude["<$>"]((__dict_Applicative_1["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Element.create(_1.value0)(_1.value1)(Prelude["<$>"](Prelude.functorArray)(Prelude["<$>"](functorProp)(g))(_1.value2)))(Data_Traversable.traverse(Data_Traversable.traversableArray)(__dict_Applicative_1)(fillSlot(__dict_Applicative_1)(f)(g))(_1.value3));
                  };
                  if (_1 instanceof Slot) {
                      return f(_1.value0);
                  };
                  throw new Error("Failed pattern match: " + [ f.constructor.name, g.constructor.name, _1.constructor.name ]);
              };
          };
      };
  };
  var eventName = EventName;
  var element = Element.create(Data_Maybe.Nothing.value);
  var booleanIsProp = new IsProp(function (name) {
      return function (_16) {
          return function (_17) {
              if (_17) {
                  return runAttrName(name);
              };
              if (!_17) {
                  return "";
              };
              throw new Error("Failed pattern match at Halogen.HTML.Core line 146, column 1 - line 151, column 1: " + [ name.constructor.name, _16.constructor.name, _17.constructor.name ]);
          };
      };
  });
  var bifunctorHTML = new Data_Bifunctor.Bifunctor(function (f) {
      return function (g) {
          var go = function (_8) {
              if (_8 instanceof Text) {
                  return new Text(_8.value0);
              };
              if (_8 instanceof Element) {
                  return new Element(_8.value0, _8.value1, Prelude["<$>"](Prelude.functorArray)(Prelude["<$>"](functorProp)(g))(_8.value2), Prelude["<$>"](Prelude.functorArray)(go)(_8.value3));
              };
              if (_8 instanceof Slot) {
                  return new Slot(f(_8.value0));
              };
              throw new Error("Failed pattern match at Halogen.HTML.Core line 62, column 1 - line 69, column 1: " + [ _8.constructor.name ]);
          };
          return go;
      };
  });
  var functorHTML = new Prelude.Functor(Data_Bifunctor.rmap(bifunctorHTML));
  var attrName = AttrName;
  exports["HandlerF"] = HandlerF;
  exports["PropF"] = PropF;
  exports["Prop"] = Prop;
  exports["Attr"] = Attr;
  exports["Key"] = Key;
  exports["Handler"] = Handler;
  exports["Initializer"] = Initializer;
  exports["Finalizer"] = Finalizer;
  exports["Text"] = Text;
  exports["Element"] = Element;
  exports["Slot"] = Slot;
  exports["IsProp"] = IsProp;
  exports["runEventName"] = runEventName;
  exports["eventName"] = eventName;
  exports["runAttrName"] = runAttrName;
  exports["attrName"] = attrName;
  exports["runPropName"] = runPropName;
  exports["propName"] = propName;
  exports["runTagName"] = runTagName;
  exports["tagName"] = tagName;
  exports["runNamespace"] = runNamespace;
  exports["toPropString"] = toPropString;
  exports["handler'"] = handler$prime;
  exports["handler"] = handler;
  exports["prop"] = prop;
  exports["fillSlot"] = fillSlot;
  exports["element"] = element;
  exports["bifunctorHTML"] = bifunctorHTML;
  exports["functorHTML"] = functorHTML;
  exports["functorProp"] = functorProp;
  exports["stringIsProp"] = stringIsProp;
  exports["booleanIsProp"] = booleanIsProp;;
 
})(PS["Halogen.HTML.Core"] = PS["Halogen.HTML.Core"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Coroutine_Aff = PS["Control.Coroutine.Aff"];
  var Control_Coroutine_Stalling = PS["Control.Coroutine.Stalling"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Aff_AVar = PS["Control.Monad.Aff.AVar"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_Free = PS["Control.Monad.Free"];
  var Data_Const = PS["Data.Const"];
  var Data_Either = PS["Data.Either"];
  var Data_Functor_Coproduct = PS["Data.Functor.Coproduct"];
  var Data_Maybe = PS["Data.Maybe"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];             
  var runEventSource = function (_0) {
      return _0;
  };
  exports["runEventSource"] = runEventSource;;
 
})(PS["Halogen.Query.EventSource"] = PS["Halogen.Query.EventSource"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Control_Monad_State_Class = PS["Control.Monad.State.Class"];
  var Prelude = PS["Prelude"];
  var Control_Monad_State = PS["Control.Monad.State"];
  var Data_Functor = PS["Data.Functor"];
  var Data_NaturalTransformation = PS["Data.NaturalTransformation"];     
  var Get = (function () {
      function Get(value0) {
          this.value0 = value0;
      };
      Get.create = function (value0) {
          return new Get(value0);
      };
      return Get;
  })();
  var Modify = (function () {
      function Modify(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      Modify.create = function (value0) {
          return function (value1) {
              return new Modify(value0, value1);
          };
      };
      return Modify;
  })();
  var stateN = function (__dict_Monad_0) {
      return function (__dict_MonadState_1) {
          return function (_3) {
              if (_3 instanceof Get) {
                  return Prelude[">>="](__dict_Monad_0["__superclass_Prelude.Bind_1"]())(Control_Monad_State_Class.get(__dict_MonadState_1))(function (_20) {
                      return Prelude.pure(__dict_Monad_0["__superclass_Prelude.Applicative_0"]())(_3.value0(_20));
                  });
              };
              if (_3 instanceof Modify) {
                  return Data_Functor["$>"](((__dict_Monad_0["__superclass_Prelude.Bind_1"]())["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]())(Control_Monad_State_Class.modify(__dict_MonadState_1)(_3.value0))(_3.value1);
              };
              throw new Error("Failed pattern match at Halogen.Query.StateF line 33, column 1 - line 34, column 1: " + [ _3.constructor.name ]);
          };
      };
  };
  var functorStateF = new Prelude.Functor(function (f) {
      return function (_4) {
          if (_4 instanceof Get) {
              return new Get(function (_22) {
                  return f(_4.value0(_22));
              });
          };
          if (_4 instanceof Modify) {
              return new Modify(_4.value0, f(_4.value1));
          };
          throw new Error("Failed pattern match at Halogen.Query.StateF line 21, column 1 - line 27, column 1: " + [ f.constructor.name, _4.constructor.name ]);
      };
  });
  exports["Get"] = Get;
  exports["Modify"] = Modify;
  exports["stateN"] = stateN;
  exports["functorStateF"] = functorStateF;;
 
})(PS["Halogen.Query.StateF"] = PS["Halogen.Query.StateF"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Plus = PS["Control.Plus"];
  var Control_Monad_Free_Trans = PS["Control.Monad.Free.Trans"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Inject = PS["Data.Inject"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_NaturalTransformation = PS["Data.NaturalTransformation"];
  var Halogen_Query_StateF = PS["Halogen.Query.StateF"];
  var Halogen_Query_EventSource = PS["Halogen.Query.EventSource"];
  var Control_Coroutine_Stalling = PS["Control.Coroutine.Stalling"];     
  var StateHF = (function () {
      function StateHF(value0) {
          this.value0 = value0;
      };
      StateHF.create = function (value0) {
          return new StateHF(value0);
      };
      return StateHF;
  })();
  var SubscribeHF = (function () {
      function SubscribeHF(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      SubscribeHF.create = function (value0) {
          return function (value1) {
              return new SubscribeHF(value0, value1);
          };
      };
      return SubscribeHF;
  })();
  var QueryHF = (function () {
      function QueryHF(value0) {
          this.value0 = value0;
      };
      QueryHF.create = function (value0) {
          return new QueryHF(value0);
      };
      return QueryHF;
  })();
  var HaltHF = (function () {
      function HaltHF() {

      };
      HaltHF.value = new HaltHF();
      return HaltHF;
  })();
  var functorHalogenF = function (__dict_Functor_4) {
      return new Prelude.Functor(function (f) {
          return function (h) {
              if (h instanceof StateHF) {
                  return new StateHF(Prelude.map(Halogen_Query_StateF.functorStateF)(f)(h.value0));
              };
              if (h instanceof SubscribeHF) {
                  return new SubscribeHF(h.value0, f(h.value1));
              };
              if (h instanceof QueryHF) {
                  return new QueryHF(Prelude.map(__dict_Functor_4)(f)(h.value0));
              };
              if (h instanceof HaltHF) {
                  return HaltHF.value;
              };
              throw new Error("Failed pattern match at Halogen.Query.HalogenF line 31, column 1 - line 39, column 1: " + [ h.constructor.name ]);
          };
      });
  };
  exports["StateHF"] = StateHF;
  exports["SubscribeHF"] = SubscribeHF;
  exports["QueryHF"] = QueryHF;
  exports["HaltHF"] = HaltHF;
  exports["functorHalogenF"] = functorHalogenF;;
 
})(PS["Halogen.Query.HalogenF"] = PS["Halogen.Query.HalogenF"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Aff_Class = PS["Control.Monad.Aff.Class"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Free = PS["Control.Monad.Free"];
  var Data_Inject = PS["Data.Inject"];
  var Halogen_Query_EventSource = PS["Halogen.Query.EventSource"];
  var Halogen_Query_HalogenF = PS["Halogen.Query.HalogenF"];
  var Halogen_Query_StateF = PS["Halogen.Query.StateF"];
  var modify = function (f) {
      return Control_Monad_Free.liftF(new Halogen_Query_HalogenF.StateHF(new Halogen_Query_StateF.Modify(f, Prelude.unit)));
  };
  var liftH = function (_0) {
      return Control_Monad_Free.liftF(Halogen_Query_HalogenF.QueryHF.create(_0));
  };
  var liftAff$prime = function (__dict_MonadAff_1) {
      return function (_2) {
          return liftH(Control_Monad_Aff_Class.liftAff(__dict_MonadAff_1)(_2));
      };
  };                                             
  var action = function (act) {
      return act(Prelude.unit);
  };
  exports["liftAff'"] = liftAff$prime;
  exports["liftH"] = liftH;
  exports["modify"] = modify;
  exports["action"] = action;;
 
})(PS["Halogen.Query"] = PS["Halogen.Query"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Apply = PS["Control.Apply"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Free = PS["Control.Monad.Free"];
  var Control_Monad_Free_Trans = PS["Control.Monad.Free.Trans"];
  var Control_Monad_State = PS["Control.Monad.State"];
  var Control_Monad_State_Class = PS["Control.Monad.State.Class"];
  var Control_Monad_State_Trans = PS["Control.Monad.State.Trans"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Functor_Coproduct = PS["Data.Functor.Coproduct"];
  var Data_Map = PS["Data.Map"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_Unsafe = PS["Data.Maybe.Unsafe"];
  var Data_NaturalTransformation = PS["Data.NaturalTransformation"];
  var Data_Profunctor_Choice = PS["Data.Profunctor.Choice"];
  var Data_Traversable = PS["Data.Traversable"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Void = PS["Data.Void"];
  var Halogen_Component_ChildPath = PS["Halogen.Component.ChildPath"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var Halogen_Query = PS["Halogen.Query"];
  var Halogen_Query_EventSource = PS["Halogen.Query.EventSource"];
  var Halogen_Query_HalogenF = PS["Halogen.Query.HalogenF"];
  var Halogen_Query_StateF = PS["Halogen.Query.StateF"];
  var Data_Identity = PS["Data.Identity"];
  var Control_Coroutine_Stalling = PS["Control.Coroutine.Stalling"];
  var ChildF = (function () {
      function ChildF(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      ChildF.create = function (value0) {
          return function (value1) {
              return new ChildF(value0, value1);
          };
      };
      return ChildF;
  })();
  var renderComponent = function (_14) {
      return Control_Monad_State.runState(_14.render);
  };
  var render = function (__dict_Ord_2) {
      return function (rc) {
          var renderChild$prime = function (p) {
              return function (c) {
                  return function (s) {
                      var _36 = renderComponent(c)(s);
                      return Prelude.bind(Control_Monad_State_Trans.bindStateT(Data_Identity.monadIdentity))(Control_Monad_State_Class.modify(Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity))(function (_8) {
                          return {
                              parent: _8.parent, 
                              children: Data_Map.insert(__dict_Ord_2)(p)(new Data_Tuple.Tuple(c, _36.value1))(_8.children), 
                              memo: _8.memo
                          };
                      }))(function () {
                          return Prelude.pure(Control_Monad_State_Trans.applicativeStateT(Data_Identity.monadIdentity))(Prelude["<$>"](Halogen_HTML_Core.functorHTML)(function (_82) {
                              return Data_Functor_Coproduct.right(ChildF.create(p)(_82));
                          })(_36.value0));
                      });
                  };
              };
          };
          var renderChild = function (_17) {
              return function (_18) {
                  var childState = Data_Map.lookup(__dict_Ord_2)(_18.value0)(_17.children);
                  var _42 = Data_Map.lookup(__dict_Ord_2)(_18.value0)(_17.memo);
                  if (_42 instanceof Data_Maybe.Just) {
                      return Prelude.bind(Control_Monad_State_Trans.bindStateT(Data_Identity.monadIdentity))(Control_Monad_State_Class.modify(Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity))(function (_7) {
                          return {
                              parent: _7.parent, 
                              children: Data_Map.alter(__dict_Ord_2)(Prelude["const"](childState))(_18.value0)(_7.children), 
                              memo: Data_Map.insert(__dict_Ord_2)(_18.value0)(_42.value0)(_7.memo)
                          };
                      }))(function () {
                          return Prelude.pure(Control_Monad_State_Trans.applicativeStateT(Data_Identity.monadIdentity))(_42.value0);
                      });
                  };
                  if (_42 instanceof Data_Maybe.Nothing) {
                      if (childState instanceof Data_Maybe.Just) {
                          return renderChild$prime(_18.value0)(childState.value0.value0)(childState.value0.value1);
                      };
                      if (childState instanceof Data_Maybe.Nothing) {
                          var def$prime = _18.value1(Prelude.unit);
                          return renderChild$prime(_18.value0)(def$prime.component)(def$prime.initialState);
                      };
                      throw new Error("Failed pattern match at Halogen.Component line 244, column 1 - line 249, column 1: " + [ childState.constructor.name ]);
                  };
                  throw new Error("Failed pattern match at Halogen.Component line 244, column 1 - line 249, column 1: " + [ _42.constructor.name ]);
              };
          };
          return Prelude.bind(Control_Monad_State_Trans.bindStateT(Data_Identity.monadIdentity))(Control_Monad_State_Class.get(Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity)))(function (_1) {
              var html = rc(_1.parent);
              return Prelude.bind(Control_Monad_State_Trans.bindStateT(Data_Identity.monadIdentity))(Control_Monad_State_Class.put(Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity))({
                  parent: _1.parent, 
                  children: Data_Map.empty, 
                  memo: Data_Map.empty
              }))(function () {
                  return Halogen_HTML_Core.fillSlot(Control_Monad_State_Trans.applicativeStateT(Data_Identity.monadIdentity))(renderChild(_1))(Data_Functor_Coproduct.left)(html);
              });
          });
      };
  };
  var queryComponent = function (_15) {
      return _15["eval"];
  };
  var component = function (r) {
      return function (e) {
          return {
              render: Control_Monad_State_Class.gets(Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity))(r), 
              "eval": e
          };
      };
  };
  exports["ChildF"] = ChildF;
  exports["queryComponent"] = queryComponent;
  exports["renderComponent"] = renderComponent;
  exports["component"] = component;;
 
})(PS["Halogen.Component"] = PS["Halogen.Component"] || {});
(function(exports) {
  /* global exports, require */
  "use strict";

  // module Halogen.Internal.VirtualDOM

  // jshint maxparams: 2
  exports.prop = function (key, value) {
    var props = {};
    props[key] = value;
    return props;
  };

  // jshint maxparams: 2
  exports.attr = function (key, value) {
    var props = { attributes: {} };
    props.attributes[key] = value;
    return props;
  };

  function HandlerHook (key, f) {
    this.key = key;
    this.callback = function (e) {
      f(e)();
    };
  }

  HandlerHook.prototype = {
    hook: function (node) {
      node.addEventListener(this.key, this.callback);
    },
    unhook: function (node) {
      node.removeEventListener(this.key, this.callback);
    }
  };

  // jshint maxparams: 2
  exports.handlerProp = function (key, f) {
    var props = {};
    props["halogen-hook-" + key] = new HandlerHook(key, f);
    return props;
  };

  // jshint maxparams: 3
  function ifHookFn (node, prop, diff) {
    // jshint validthis: true
    if (typeof diff === "undefined") {
      this.f(node)();
    }
  }

  // jshint maxparams: 1
  function InitHook (f) {
    this.f = f;
  }

  InitHook.prototype = {
    hook: ifHookFn
  };

  exports.initProp = function (f) {
    return { "halogen-init": new InitHook(f) };
  };

  function FinalHook (f) {
    this.f = f;
  }

  FinalHook.prototype = {
    unhook: ifHookFn
  };

  exports.finalizerProp = function (f) {
    return { "halogen-final": new FinalHook(f) };
  };

  exports.concatProps = function () {
    // jshint maxparams: 2
    var hOP = Object.prototype.hasOwnProperty;
    var copy = function (props, result) {
      for (var key in props) {
        if (hOP.call(props, key)) {
          if (key === "attributes") {
            var attrs = props[key];
            var resultAttrs = result[key] || (result[key] = {});
            for (var attr in attrs) {
              if (hOP.call(attrs, attr)) {
                resultAttrs[attr] = attrs[attr];
              }
            }
          } else {
            result[key] = props[key];
          }
        }
      }
      return result;
    };
    return function (p1, p2) {
      return copy(p2, copy(p1, {}));
    };
  }();

  exports.emptyProps = {};

  exports.createElement = function () {
    var vcreateElement = require("virtual-dom/create-element");
    return function (vtree) {
      return vcreateElement(vtree);
    };
  }();

  exports.diff = function () {
    var vdiff = require("virtual-dom/diff");
    return function (vtree1) {
      return function (vtree2) {
        return vdiff(vtree1, vtree2);
      };
    };
  }();

  exports.patch = function () {
    var vpatch = require("virtual-dom/patch");
    return function (p) {
      return function (node) {
        return function () {
          return vpatch(node, p);
        };
      };
    };
  }();

  exports.vtext = function () {
    var VText = require("virtual-dom/vnode/vtext");
    return function (s) {
      return new VText(s);
    };
  }();

  exports.vnode = function () {
    var VirtualNode = require("virtual-dom/vnode/vnode");
    var SoftSetHook = require("virtual-dom/virtual-hyperscript/hooks/soft-set-hook");
    return function (namespace) {
      return function (name) {
        return function (key) {
          return function (props) {
            return function (children) {
              if (name === "input" && props.value !== undefined) {
                props.value = new SoftSetHook(props.value);
              }
              return new VirtualNode(name, props, children, key, namespace);
            };
          };
        };
      };
    };
  }();
 
})(PS["Halogen.Internal.VirtualDOM"] = PS["Halogen.Internal.VirtualDOM"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Halogen.Internal.VirtualDOM"];
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Nullable = PS["Data.Nullable"];
  var Data_Function = PS["Data.Function"];
  var DOM = PS["DOM"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];     
  var semigroupProps = new Prelude.Semigroup(Data_Function.runFn2($foreign.concatProps));
  var monoidProps = new Data_Monoid.Monoid(function () {
      return semigroupProps;
  }, $foreign.emptyProps);
  exports["semigroupProps"] = semigroupProps;
  exports["monoidProps"] = monoidProps;
  exports["vnode"] = $foreign.vnode;
  exports["vtext"] = $foreign.vtext;
  exports["patch"] = $foreign.patch;
  exports["diff"] = $foreign.diff;
  exports["createElement"] = $foreign.createElement;
  exports["finalizerProp"] = $foreign.finalizerProp;
  exports["initProp"] = $foreign.initProp;
  exports["handlerProp"] = $foreign.handlerProp;
  exports["attr"] = $foreign.attr;
  exports["prop"] = $foreign.prop;;
 
})(PS["Halogen.Internal.VirtualDOM"] = PS["Halogen.Internal.VirtualDOM"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Data_Exists = PS["Data.Exists"];
  var Data_ExistsR = PS["Data.ExistsR"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Function = PS["Data.Function"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Nullable = PS["Data.Nullable"];
  var Halogen_Effects = PS["Halogen.Effects"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var Halogen_HTML_Events_Handler = PS["Halogen.HTML.Events.Handler"];
  var Halogen_Internal_VirtualDOM = PS["Halogen.Internal.VirtualDOM"];     
  var handleAff = Control_Monad_Aff.runAff(Control_Monad_Eff_Exception.throwException)(Prelude["const"](Prelude.pure(Control_Monad_Eff.applicativeEff)(Prelude.unit)));
  var renderProp = function (dr) {
      return function (_2) {
          if (_2 instanceof Halogen_HTML_Core.Prop) {
              return Data_Exists.runExists(function (_0) {
                  return Halogen_Internal_VirtualDOM.prop(Halogen_HTML_Core.runPropName(_0.value0), _0.value1);
              })(_2.value0);
          };
          if (_2 instanceof Halogen_HTML_Core.Attr) {
              var attrName = Data_Maybe.maybe("")(function (ns$prime) {
                  return Halogen_HTML_Core.runNamespace(ns$prime) + ":";
              })(_2.value0) + Halogen_HTML_Core.runAttrName(_2.value1);
              return Halogen_Internal_VirtualDOM.attr(attrName, _2.value2);
          };
          if (_2 instanceof Halogen_HTML_Core.Handler) {
              return Data_ExistsR.runExistsR(function (_1) {
                  return Halogen_Internal_VirtualDOM.handlerProp(Halogen_HTML_Core.runEventName(_1.value0), function (ev) {
                      return handleAff(Prelude[">>="](Control_Monad_Aff.bindAff)(Halogen_HTML_Events_Handler.runEventHandler(Control_Monad_Aff.monadAff)(Control_Monad_Aff.monadEffAff)(ev)(_1.value1(ev)))(Data_Maybe.maybe(Prelude.pure(Control_Monad_Aff.applicativeAff)(Prelude.unit))(dr)));
                  });
              })(_2.value0);
          };
          if (_2 instanceof Halogen_HTML_Core.Initializer) {
              return Halogen_Internal_VirtualDOM.initProp(function (_31) {
                  return handleAff(dr(_2.value0(_31)));
              });
          };
          if (_2 instanceof Halogen_HTML_Core.Finalizer) {
              return Halogen_Internal_VirtualDOM.finalizerProp(function (_32) {
                  return handleAff(dr(_2.value0(_32)));
              });
          };
          return Data_Monoid.mempty(Halogen_Internal_VirtualDOM.monoidProps);
      };
  };
  var findKey = function (r) {
      return function (_3) {
          if (_3 instanceof Halogen_HTML_Core.Key) {
              return new Data_Maybe.Just(_3.value0);
          };
          return r;
      };
  };
  var renderHTML = function (f) {
      var go = function (_4) {
          if (_4 instanceof Halogen_HTML_Core.Text) {
              return Halogen_Internal_VirtualDOM.vtext(_4.value0);
          };
          if (_4 instanceof Halogen_HTML_Core.Element) {
              var tag = Halogen_HTML_Core.runTagName(_4.value1);
              var ns$prime = Data_Nullable.toNullable(Prelude["<$>"](Data_Maybe.functorMaybe)(Halogen_HTML_Core.runNamespace)(_4.value0));
              var key = Data_Nullable.toNullable(Data_Foldable.foldl(Data_Foldable.foldableArray)(findKey)(Data_Maybe.Nothing.value)(_4.value2));
              return Halogen_Internal_VirtualDOM.vnode(ns$prime)(tag)(key)(Data_Foldable.foldMap(Data_Foldable.foldableArray)(Halogen_Internal_VirtualDOM.monoidProps)(renderProp(f))(_4.value2))(Prelude.map(Prelude.functorArray)(go)(_4.value3));
          };
          if (_4 instanceof Halogen_HTML_Core.Slot) {
              return Halogen_Internal_VirtualDOM.vtext("");
          };
          throw new Error("Failed pattern match at Halogen.HTML.Renderer.VirtualDOM line 27, column 1 - line 28, column 1: " + [ _4.constructor.name ]);
      };
      return go;
  };
  exports["renderHTML"] = renderHTML;;
 
})(PS["Halogen.HTML.Renderer.VirtualDOM"] = PS["Halogen.HTML.Renderer.VirtualDOM"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Coroutine = PS["Control.Coroutine"];
  var Control_Coroutine_Stalling = PS["Control.Coroutine.Stalling"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Aff_AVar = PS["Control.Monad.Aff.AVar"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Free = PS["Control.Monad.Free"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_Monad_State = PS["Control.Monad.State"];
  var Control_Monad_Trans = PS["Control.Monad.Trans"];
  var Control_Plus = PS["Control.Plus"];
  var Data_NaturalTransformation = PS["Data.NaturalTransformation"];
  var Data_Tuple = PS["Data.Tuple"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var Halogen_Component = PS["Halogen.Component"];
  var Halogen_Effects = PS["Halogen.Effects"];
  var Halogen_HTML_Renderer_VirtualDOM = PS["Halogen.HTML.Renderer.VirtualDOM"];
  var Halogen_Internal_VirtualDOM = PS["Halogen.Internal.VirtualDOM"];
  var Halogen_Query = PS["Halogen.Query"];
  var Halogen_Query_StateF = PS["Halogen.Query.StateF"];
  var Halogen_Query_EventSource = PS["Halogen.Query.EventSource"];
  var Halogen_Query_HalogenF = PS["Halogen.Query.HalogenF"];
  var Control_Monad_State_Trans = PS["Control.Monad.State.Trans"];
  var Data_Identity = PS["Data.Identity"];
  var Control_Monad_Free_Trans = PS["Control.Monad.Free.Trans"];     
  var runUI = function (c) {
      return function (s) {
          var render = function (ref) {
              return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Aff_AVar.takeVar(ref))(function (_3) {
                  var _6 = !_3.renderPending;
                  if (_6) {
                      return Control_Monad_Aff_AVar.putVar(ref)(_3);
                  };
                  if (!_6) {
                      var _7 = Halogen_Component.renderComponent(c)(_3.state);
                      var vtree$prime = Halogen_HTML_Renderer_VirtualDOM.renderHTML(driver(ref))(_7.value0);
                      return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Halogen_Internal_VirtualDOM.patch(Halogen_Internal_VirtualDOM.diff(_3.vtree)(vtree$prime))(_3.node)))(function (_2) {
                          return Control_Monad_Aff_AVar.putVar(ref)({
                              node: _2, 
                              vtree: vtree$prime, 
                              state: _7.value1, 
                              renderPending: false
                          });
                      });
                  };
                  throw new Error("Failed pattern match at Halogen.Driver line 56, column 1 - line 61, column 1: " + [ _6.constructor.name ]);
              });
          };
          var $$eval = function (ref) {
              return function (h) {
                  if (h instanceof Halogen_Query_HalogenF.StateHF) {
                      return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Aff_AVar.takeVar(ref))(function (_1) {
                          var _13 = Control_Monad_State.runState(Halogen_Query_StateF.stateN(Control_Monad_State_Trans.monadStateT(Data_Identity.monadIdentity))(Control_Monad_State_Trans.monadStateStateT(Data_Identity.monadIdentity))(h.value0))(_1.state);
                          return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Aff_AVar.putVar(ref)({
                              node: _1.node, 
                              vtree: _1.vtree, 
                              state: _13.value1, 
                              renderPending: true
                          }))(function () {
                              return Prelude.pure(Control_Monad_Aff.applicativeAff)(_13.value0);
                          });
                      });
                  };
                  if (h instanceof Halogen_Query_HalogenF.SubscribeHF) {
                      var producer = Halogen_Query_EventSource.runEventSource(h.value0);
                      var consumer = Control_Monad_Rec_Class.forever(Control_Monad_Free_Trans.monadRecFreeT(Control_Coroutine.functorAwait)(Control_Monad_Aff.monadAff))(Control_Bind["=<<"](Control_Monad_Free_Trans.bindFreeT(Control_Coroutine.functorAwait)(Control_Monad_Aff.monadAff))(function (_25) {
                          return Control_Monad_Trans.lift(Control_Monad_Free_Trans.monadTransFreeT(Control_Coroutine.functorAwait))(Control_Monad_Aff.monadAff)(driver(ref)(_25));
                      })(Control_Coroutine.await(Control_Monad_Aff.monadAff)));
                      return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Aff.forkAff(Control_Coroutine_Stalling.runStallingProcess(Control_Monad_Aff.monadRecAff)(Control_Coroutine_Stalling["$$?"](Control_Monad_Aff.monadRecAff)(producer)(consumer))))(function () {
                          return Prelude.pure(Control_Monad_Aff.applicativeAff)(h.value1);
                      });
                  };
                  if (h instanceof Halogen_Query_HalogenF.QueryHF) {
                      return Prelude.bind(Control_Monad_Aff.bindAff)(render(ref))(function () {
                          return h.value0;
                      });
                  };
                  if (h instanceof Halogen_Query_HalogenF.HaltHF) {
                      return Control_Plus.empty(Control_Monad_Aff.plusAff);
                  };
                  throw new Error("Failed pattern match at Halogen.Driver line 56, column 1 - line 61, column 1: " + [ h.constructor.name ]);
              };
          };
          var driver = function (ref) {
              return function (q) {
                  return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Free.runFreeM(Halogen_Query_HalogenF.functorHalogenF(Control_Monad_Aff.functorAff))(Control_Monad_Aff.monadRecAff)($$eval(ref))(Halogen_Component.queryComponent(c)(q)))(function (_0) {
                      return Prelude.bind(Control_Monad_Aff.bindAff)(render(ref))(function () {
                          return Prelude.pure(Control_Monad_Aff.applicativeAff)(_0);
                      });
                  });
              };
          };
          var _21 = Halogen_Component.renderComponent(c)(s);
          return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Aff_AVar.makeVar)(function (_4) {
              var vtree = Halogen_HTML_Renderer_VirtualDOM.renderHTML(driver(_4))(_21.value0);
              var node = Halogen_Internal_VirtualDOM.createElement(vtree);
              return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Aff_AVar.putVar(_4)({
                  node: node, 
                  vtree: vtree, 
                  state: _21.value1, 
                  renderPending: false
              }))(function () {
                  return Prelude.pure(Control_Monad_Aff.applicativeAff)({
                      node: node, 
                      driver: driver(_4)
                  });
              });
          });
      };
  };
  exports["runUI"] = runUI;;
 
})(PS["Halogen.Driver"] = PS["Halogen.Driver"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var textarea = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("textarea"))(xs)([  ]);
  };                             
  var pre = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("pre"))(xs);
  };
  var pre_ = pre([  ]);
  var p = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("p"))(xs);
  };
  var p_ = p([  ]);  
  var h2 = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("h2"))(xs);
  };
  var h2_ = h2([  ]);
  var h1 = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("h1"))(xs);
  };
  var h1_ = h1([  ]);
  var div = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("div"))(xs);
  };
  var div_ = div([  ]);
  var code = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("code"))(xs);
  };
  var code_ = code([  ]);
  var button = function (xs) {
      return Halogen_HTML_Core.element(Halogen_HTML_Core.tagName("button"))(xs);
  };
  exports["textarea"] = textarea;
  exports["pre_"] = pre_;
  exports["pre"] = pre;
  exports["p_"] = p_;
  exports["p"] = p;
  exports["h2_"] = h2_;
  exports["h2"] = h2;
  exports["h1_"] = h1_;
  exports["h1"] = h1;
  exports["div_"] = div_;
  exports["div"] = div;
  exports["code_"] = code_;
  exports["code"] = code;
  exports["button"] = button;;
 
})(PS["Halogen.HTML.Elements"] = PS["Halogen.HTML.Elements"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Halogen_Component = PS["Halogen.Component"];
  var Halogen_Component_ChildPath = PS["Halogen.Component.ChildPath"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var Halogen_HTML_Elements = PS["Halogen.HTML.Elements"];     
  var text = Halogen_HTML_Core.Text.create;
  exports["text"] = text;;
 
})(PS["Halogen.HTML"] = PS["Halogen.HTML"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_String = PS["Data.String"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var value = Halogen_HTML_Core.prop(Halogen_HTML_Core.stringIsProp)(Halogen_HTML_Core.propName("value"))(Data_Maybe.Just.create(Halogen_HTML_Core.attrName("value")));
  var disabled = Halogen_HTML_Core.prop(Halogen_HTML_Core.booleanIsProp)(Halogen_HTML_Core.propName("disabled"))(Data_Maybe.Just.create(Halogen_HTML_Core.attrName("disabled")));
  exports["disabled"] = disabled;
  exports["value"] = value;;
 
})(PS["Halogen.HTML.Properties"] = PS["Halogen.HTML.Properties"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Array = PS["Data.Array"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var Halogen_HTML_Properties = PS["Halogen.HTML.Properties"];
  var Data_Monoid = PS["Data.Monoid"];                                  
  var value = Unsafe_Coerce.unsafeCoerce(Halogen_HTML_Properties.value);        
  var disabled = Unsafe_Coerce.unsafeCoerce(Halogen_HTML_Properties.disabled);
  exports["disabled"] = disabled;
  exports["value"] = value;;
 
})(PS["Halogen.HTML.Properties.Indexed"] = PS["Halogen.HTML.Properties.Indexed"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var Halogen_HTML_Properties_Indexed = PS["Halogen.HTML.Properties.Indexed"];
  var Halogen_HTML_Elements = PS["Halogen.HTML.Elements"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];                            
  var textarea = Unsafe_Coerce.unsafeCoerce(Halogen_HTML_Elements.textarea);
  var button = Unsafe_Coerce.unsafeCoerce(Halogen_HTML_Elements.button);
  exports["textarea"] = textarea;
  exports["button"] = button;;
 
})(PS["Halogen.HTML.Elements.Indexed"] = PS["Halogen.HTML.Elements.Indexed"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Halogen_Query = PS["Halogen.Query"];
  var Halogen_HTML_Events_Handler = PS["Halogen.HTML.Events.Handler"];
  var Halogen_HTML_Events_Types = PS["Halogen.HTML.Events.Types"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];                                          
  var onClick = Halogen_HTML_Core.handler(Halogen_HTML_Core.eventName("click"));
  var input_ = function (f) {
      return function (_0) {
          return Prelude.pure(Halogen_HTML_Events_Handler.applicativeEventHandler)(Halogen_Query.action(f));
      };
  };
  var input = function (f) {
      return function (x) {
          return Prelude.pure(Halogen_HTML_Events_Handler.applicativeEventHandler)(Halogen_Query.action(f(x)));
      };
  };
  exports["onClick"] = onClick;
  exports["input_"] = input_;
  exports["input"] = input;;
 
})(PS["Halogen.HTML.Events"] = PS["Halogen.HTML.Events"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Class = PS["Data.Foreign.Class"];
  var Data_Maybe = PS["Data.Maybe"];
  var Halogen_HTML_Core = PS["Halogen.HTML.Core"];
  var Halogen_HTML_Events_Handler = PS["Halogen.HTML.Events.Handler"];
  var Data_Foreign_Index = PS["Data.Foreign.Index"];     
  var addForeignPropHandler = function (__dict_IsForeign_0) {
      return function (key) {
          return function (prop) {
              return function (f) {
                  return Halogen_HTML_Core["handler'"](Halogen_HTML_Core.eventName(key))(function (_1) {
                      return Data_Either.either(Prelude["const"](Prelude.pure(Halogen_HTML_Events_Handler.applicativeEventHandler)(Data_Maybe.Nothing.value)))(function (_2) {
                          return Prelude.map(Halogen_HTML_Events_Handler.functorEventHandler)(Data_Maybe.Just.create)(f(_2));
                      })(Data_Foreign_Class.readProp(__dict_IsForeign_0)(Data_Foreign_Index.indexString)(prop)(Data_Foreign.toForeign((function (_0) {
                          return _0.target;
                      })(_1))));
                  });
              };
          };
      };
  };                                                                                               
  var onValueInput = addForeignPropHandler(Data_Foreign_Class.stringIsForeign)("input")("value");
  exports["onValueInput"] = onValueInput;;
 
})(PS["Halogen.HTML.Events.Forms"] = PS["Halogen.HTML.Events.Forms"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];
  var Halogen_HTML_Events_Handler = PS["Halogen.HTML.Events.Handler"];
  var Halogen_HTML_Events_Types = PS["Halogen.HTML.Events.Types"];
  var Halogen_HTML_Properties_Indexed = PS["Halogen.HTML.Properties.Indexed"];
  var Halogen_HTML_Events = PS["Halogen.HTML.Events"];
  var Halogen_HTML_Events_Forms = PS["Halogen.HTML.Events.Forms"];     
  var onValueInput = Unsafe_Coerce.unsafeCoerce(Halogen_HTML_Events_Forms.onValueInput);
  var onClick = Unsafe_Coerce.unsafeCoerce(Halogen_HTML_Events.onClick);
  exports["onValueInput"] = onValueInput;
  exports["onClick"] = onClick;;
 
})(PS["Halogen.HTML.Events.Indexed"] = PS["Halogen.HTML.Events.Indexed"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Nullable = PS["Data.Nullable"];
  var DOM = PS["DOM"];
  var DOM_Event_EventTarget = PS["DOM.Event.EventTarget"];
  var DOM_Event_EventTypes = PS["DOM.Event.EventTypes"];
  var DOM_HTML = PS["DOM.HTML"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var DOM_HTML_Window = PS["DOM.HTML.Window"];
  var DOM_Node_Node = PS["DOM.Node.Node"];
  var DOM_Node_ParentNode = PS["DOM.Node.ParentNode"];
  var DOM_Node_Types = PS["DOM.Node.Types"];     
  var onLoad = function (__dict_MonadEff_0) {
      return function (callback) {
          return Control_Monad_Eff_Class.liftEff(__dict_MonadEff_0)(Control_Bind["=<<"](Control_Monad_Eff.bindEff)(function (_6) {
              return DOM_Event_EventTarget.addEventListener(DOM_Event_EventTypes.load)(DOM_Event_EventTarget.eventListener(function (_1) {
                  return callback;
              }))(false)(DOM_HTML_Types.windowToEventTarget(_6));
          })(DOM_HTML.window));
      };
  };
  var appendTo = function (__dict_MonadEff_1) {
      return function (query) {
          return function (elem) {
              return Control_Monad_Eff_Class.liftEff(__dict_MonadEff_1)(function __do() {
                  var _0 = Prelude["<$>"](Control_Monad_Eff.functorEff)(Data_Nullable.toMaybe)(Control_Bind["=<<"](Control_Monad_Eff.bindEff)(Control_Bind["<=<"](Control_Monad_Eff.bindEff)(function (_7) {
                      return DOM_Node_ParentNode.querySelector(query)(DOM_HTML_Types.htmlDocumentToParentNode(_7));
                  })(DOM_HTML_Window.document))(DOM_HTML.window))();
                  return (function () {
                      if (_0 instanceof Data_Maybe.Nothing) {
                          return Prelude.pure(Control_Monad_Eff.applicativeEff)(Prelude.unit);
                      };
                      if (_0 instanceof Data_Maybe.Just) {
                          return Prelude["void"](Control_Monad_Eff.functorEff)(DOM_Node_Node.appendChild(DOM_HTML_Types.htmlElementToNode(elem))(DOM_Node_Types.elementToNode(_0.value0)));
                      };
                      throw new Error("Failed pattern match at Halogen.Util line 28, column 1 - line 30, column 1: " + [ _0.constructor.name ]);
                  })()();
              });
          };
      };
  };
  var appendToBody = function (__dict_MonadEff_2) {
      return appendTo(__dict_MonadEff_2)("body");
  };
  exports["onLoad"] = onLoad;
  exports["appendToBody"] = appendToBody;
  exports["appendTo"] = appendTo;;
 
})(PS["Halogen.Util"] = PS["Halogen.Util"] || {});
(function(exports) {
  /* global exports */
  /* global XMLHttpRequest */
  /* global module */
  "use strict";

  // module Network.HTTP.Affjax

  // jshint maxparams: 5
  exports._ajax = function (mkHeader, options, canceler, errback, callback) {
    var platformSpecific = { };
    if (typeof module !== "undefined" && module.require) {
      // We are on node.js
      platformSpecific.newXHR = function () {
        var XHR = module.require("xmlhttprequest").XMLHttpRequest;
        return new XHR();
      };

      platformSpecific.fixupUrl = function (url) {
        var urllib = module.require("url");
        var u = urllib.parse(url);
        u.protocol = u.protocol || "http:";
        u.hostname = u.hostname || "localhost";
        return urllib.format(u);
      };

      platformSpecific.getResponse = function (xhr) {
        // the node package 'xmlhttprequest' does not support xhr.response.
        return xhr.responseText;
      };
    } else {
      // We are in the browser
      platformSpecific.newXHR = function () {
        return new XMLHttpRequest();
      };

      platformSpecific.fixupUrl = function (url) {
        return url || "/";
      };

      platformSpecific.getResponse = function (xhr) {
        return xhr.response;
      };
    }

    return function () {
      var xhr = platformSpecific.newXHR();
      var fixedUrl = platformSpecific.fixupUrl(options.url);
      xhr.open(options.method || "GET", fixedUrl, true, options.username, options.password);
      if (options.headers) {
        for (var i = 0, header; (header = options.headers[i]) != null; i++) {
          xhr.setRequestHeader(header.field, header.value);
        }
      }
      xhr.onerror = function () {
        errback(new Error("AJAX request failed: " + options.method + " " + options.url))();
      };
      xhr.onload = function () {
        callback({
          status: xhr.status,
          headers: xhr.getAllResponseHeaders().split("\n")
            .filter(function (header) {
              return header.length > 0;
            })
            .map(function (header) {
              var i = header.indexOf(":");
              return mkHeader(header.substring(0, i))(header.substring(i + 2));
            }),
          response: platformSpecific.getResponse(xhr)
        })();
      };
      xhr.responseType = options.responseType;
      xhr.send(options.content);
      return canceler(xhr);
    };
  };

  // jshint maxparams: 4
  exports._cancelAjax = function (xhr, cancelError, errback, callback) {
    return function () {
      try { xhr.abort(); } catch (e) { return callback(false)(); }
      return callback(true)();
    };
  };

 
})(PS["Network.HTTP.Affjax"] = PS["Network.HTTP.Affjax"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var DOM_File_Types = PS["DOM.File.Types"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  var DOM_XHR_Types = PS["DOM.XHR.Types"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];
  var Data_ArrayBuffer_Types = PS["Data.ArrayBuffer.Types"];     
  var Requestable = function (toRequest) {
      this.toRequest = toRequest;
  };
  var toRequest = function (dict) {
      return dict.toRequest;
  };                                                                       
  var requestableString = new Requestable(Unsafe_Coerce.unsafeCoerce);
  exports["Requestable"] = Requestable;
  exports["toRequest"] = toRequest;
  exports["requestableString"] = requestableString;;
 
})(PS["Network.HTTP.Affjax.Request"] = PS["Network.HTTP.Affjax.Request"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var DOM_File_Types = PS["DOM.File.Types"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  var DOM_XHR_Types = PS["DOM.XHR.Types"];
  var Data_ArrayBuffer_Types = PS["Data.ArrayBuffer.Types"];     
  var ArrayBufferResponse = (function () {
      function ArrayBufferResponse() {

      };
      ArrayBufferResponse.value = new ArrayBufferResponse();
      return ArrayBufferResponse;
  })();
  var BlobResponse = (function () {
      function BlobResponse() {

      };
      BlobResponse.value = new BlobResponse();
      return BlobResponse;
  })();
  var DocumentResponse = (function () {
      function DocumentResponse() {

      };
      DocumentResponse.value = new DocumentResponse();
      return DocumentResponse;
  })();
  var JSONResponse = (function () {
      function JSONResponse() {

      };
      JSONResponse.value = new JSONResponse();
      return JSONResponse;
  })();
  var StringResponse = (function () {
      function StringResponse() {

      };
      StringResponse.value = new StringResponse();
      return StringResponse;
  })();
  var Respondable = function (fromResponse, responseType) {
      this.fromResponse = fromResponse;
      this.responseType = responseType;
  }; 
  var responseTypeToString = function (_0) {
      if (_0 instanceof ArrayBufferResponse) {
          return "arraybuffer";
      };
      if (_0 instanceof BlobResponse) {
          return "blob";
      };
      if (_0 instanceof DocumentResponse) {
          return "document";
      };
      if (_0 instanceof JSONResponse) {
          return "text";
      };
      if (_0 instanceof StringResponse) {
          return "text";
      };
      throw new Error("Failed pattern match at Network.HTTP.Affjax.Response line 41, column 1 - line 42, column 1: " + [ _0.constructor.name ]);
  };
  var responseType = function (dict) {
      return dict.responseType;
  };                                                                                     
  var responsableJSON = new Respondable(Data_Either.Right.create, JSONResponse.value);                                  
  var fromResponse = function (dict) {
      return dict.fromResponse;
  };
  exports["ArrayBufferResponse"] = ArrayBufferResponse;
  exports["BlobResponse"] = BlobResponse;
  exports["DocumentResponse"] = DocumentResponse;
  exports["JSONResponse"] = JSONResponse;
  exports["StringResponse"] = StringResponse;
  exports["Respondable"] = Respondable;
  exports["fromResponse"] = fromResponse;
  exports["responseType"] = responseType;
  exports["responseTypeToString"] = responseTypeToString;
  exports["responsableJSON"] = responsableJSON;;
 
})(PS["Network.HTTP.Affjax.Response"] = PS["Network.HTTP.Affjax.Response"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var DELETE = (function () {
      function DELETE() {

      };
      DELETE.value = new DELETE();
      return DELETE;
  })();
  var GET = (function () {
      function GET() {

      };
      GET.value = new GET();
      return GET;
  })();
  var HEAD = (function () {
      function HEAD() {

      };
      HEAD.value = new HEAD();
      return HEAD;
  })();
  var OPTIONS = (function () {
      function OPTIONS() {

      };
      OPTIONS.value = new OPTIONS();
      return OPTIONS;
  })();
  var PATCH = (function () {
      function PATCH() {

      };
      PATCH.value = new PATCH();
      return PATCH;
  })();
  var POST = (function () {
      function POST() {

      };
      POST.value = new POST();
      return POST;
  })();
  var PUT = (function () {
      function PUT() {

      };
      PUT.value = new PUT();
      return PUT;
  })();
  var MOVE = (function () {
      function MOVE() {

      };
      MOVE.value = new MOVE();
      return MOVE;
  })();
  var COPY = (function () {
      function COPY() {

      };
      COPY.value = new COPY();
      return COPY;
  })();
  var CustomMethod = (function () {
      function CustomMethod(value0) {
          this.value0 = value0;
      };
      CustomMethod.create = function (value0) {
          return new CustomMethod(value0);
      };
      return CustomMethod;
  })();
  var showMethod = new Prelude.Show(function (_3) {
      if (_3 instanceof DELETE) {
          return "DELETE";
      };
      if (_3 instanceof GET) {
          return "GET";
      };
      if (_3 instanceof HEAD) {
          return "HEAD";
      };
      if (_3 instanceof OPTIONS) {
          return "OPTIONS";
      };
      if (_3 instanceof PATCH) {
          return "PATCH";
      };
      if (_3 instanceof POST) {
          return "POST";
      };
      if (_3 instanceof PUT) {
          return "PUT";
      };
      if (_3 instanceof MOVE) {
          return "MOVE";
      };
      if (_3 instanceof COPY) {
          return "COPY";
      };
      if (_3 instanceof CustomMethod) {
          return "(CustomMethod " + (Prelude.show(Prelude.showString)(_3.value0) + ")");
      };
      throw new Error("Failed pattern match at Network.HTTP.Method line 29, column 1 - line 41, column 1: " + [ _3.constructor.name ]);
  });
  var methodToString = function (_0) {
      if (_0 instanceof CustomMethod) {
          return _0.value0;
      };
      return Prelude.show(showMethod)(_0);
  };
  exports["DELETE"] = DELETE;
  exports["GET"] = GET;
  exports["HEAD"] = HEAD;
  exports["OPTIONS"] = OPTIONS;
  exports["PATCH"] = PATCH;
  exports["POST"] = POST;
  exports["PUT"] = PUT;
  exports["MOVE"] = MOVE;
  exports["COPY"] = COPY;
  exports["CustomMethod"] = CustomMethod;
  exports["methodToString"] = methodToString;
  exports["showMethod"] = showMethod;;
 
})(PS["Network.HTTP.Method"] = PS["Network.HTTP.Method"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var mimeTypeToString = function (_0) {
      return _0;
  };
  exports["mimeTypeToString"] = mimeTypeToString;;
 
})(PS["Network.HTTP.MimeType"] = PS["Network.HTTP.MimeType"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Network_HTTP_MimeType = PS["Network.HTTP.MimeType"];     
  var Accept = (function () {
      function Accept(value0) {
          this.value0 = value0;
      };
      Accept.create = function (value0) {
          return new Accept(value0);
      };
      return Accept;
  })();
  var ContentType = (function () {
      function ContentType(value0) {
          this.value0 = value0;
      };
      ContentType.create = function (value0) {
          return new ContentType(value0);
      };
      return ContentType;
  })();
  var RequestHeader = (function () {
      function RequestHeader(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      RequestHeader.create = function (value0) {
          return function (value1) {
              return new RequestHeader(value0, value1);
          };
      };
      return RequestHeader;
  })();
  var requestHeaderValue = function (_1) {
      if (_1 instanceof Accept) {
          return Network_HTTP_MimeType.mimeTypeToString(_1.value0);
      };
      if (_1 instanceof ContentType) {
          return Network_HTTP_MimeType.mimeTypeToString(_1.value0);
      };
      if (_1 instanceof RequestHeader) {
          return _1.value1;
      };
      throw new Error("Failed pattern match at Network.HTTP.RequestHeader line 28, column 1 - line 29, column 1: " + [ _1.constructor.name ]);
  };
  var requestHeaderName = function (_0) {
      if (_0 instanceof Accept) {
          return "Accept";
      };
      if (_0 instanceof ContentType) {
          return "Content-Type";
      };
      if (_0 instanceof RequestHeader) {
          return _0.value0;
      };
      throw new Error("Failed pattern match at Network.HTTP.RequestHeader line 23, column 1 - line 24, column 1: " + [ _0.constructor.name ]);
  };
  exports["Accept"] = Accept;
  exports["ContentType"] = ContentType;
  exports["RequestHeader"] = RequestHeader;
  exports["requestHeaderValue"] = requestHeaderValue;
  exports["requestHeaderName"] = requestHeaderName;;
 
})(PS["Network.HTTP.RequestHeader"] = PS["Network.HTTP.RequestHeader"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Prelude = PS["Prelude"];     
  var ResponseHeader = (function () {
      function ResponseHeader(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      ResponseHeader.create = function (value0) {
          return function (value1) {
              return new ResponseHeader(value0, value1);
          };
      };
      return ResponseHeader;
  })();
  var responseHeader = function (field) {
      return function (value) {
          return new ResponseHeader(field, value);
      };
  };
  exports["responseHeader"] = responseHeader;;
 
})(PS["Network.HTTP.ResponseHeader"] = PS["Network.HTTP.ResponseHeader"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var $foreign = PS["Network.HTTP.Affjax"];
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Bind = PS["Control.Bind"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Aff_Par = PS["Control.Monad.Aff.Par"];
  var Control_Monad_Aff_AVar = PS["Control.Monad.Aff.AVar"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Control_Monad_Eff_Ref = PS["Control.Monad.Eff.Ref"];
  var Control_Monad_Error_Class = PS["Control.Monad.Error.Class"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Function = PS["Data.Function"];
  var Data_Int = PS["Data.Int"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Nullable = PS["Data.Nullable"];
  var DOM_XHR_Types = PS["DOM.XHR.Types"];
  var $$Math = PS["Math"];
  var Network_HTTP_Affjax_Request = PS["Network.HTTP.Affjax.Request"];
  var Network_HTTP_Affjax_Response = PS["Network.HTTP.Affjax.Response"];
  var Network_HTTP_Method = PS["Network.HTTP.Method"];
  var Network_HTTP_RequestHeader = PS["Network.HTTP.RequestHeader"];
  var Network_HTTP_ResponseHeader = PS["Network.HTTP.ResponseHeader"];
  var Network_HTTP_StatusCode = PS["Network.HTTP.StatusCode"];
  var defaultRequest = {
      method: Network_HTTP_Method.GET.value, 
      url: "/", 
      headers: [  ], 
      content: Data_Maybe.Nothing.value, 
      username: Data_Maybe.Nothing.value, 
      password: Data_Maybe.Nothing.value
  };
  var cancelAjax = function (xhr) {
      return function (err) {
          return Control_Monad_Aff.makeAff(function (eb) {
              return function (cb) {
                  return $foreign._cancelAjax(xhr, err, eb, cb);
              };
          });
      };
  };
  var affjax$prime = function (__dict_Requestable_1) {
      return function (__dict_Respondable_2) {
          return function (req) {
              return function (eb) {
                  return function (cb) {
                      var req$prime = {
                          method: Network_HTTP_Method.methodToString(req.method), 
                          url: req.url, 
                          headers: Prelude["<$>"](Prelude.functorArray)(function (h) {
                              return {
                                  field: Network_HTTP_RequestHeader.requestHeaderName(h), 
                                  value: Network_HTTP_RequestHeader.requestHeaderValue(h)
                              };
                          })(req.headers), 
                          content: Data_Nullable.toNullable(Prelude["<$>"](Data_Maybe.functorMaybe)(Network_HTTP_Affjax_Request.toRequest(__dict_Requestable_1))(req.content)), 
                          responseType: Network_HTTP_Affjax_Response.responseTypeToString(Network_HTTP_Affjax_Response.responseType(__dict_Respondable_2)), 
                          username: Data_Nullable.toNullable(req.username), 
                          password: Data_Nullable.toNullable(req.password)
                      };
                      var fromResponse$prime = (function () {
                          var _32 = Network_HTTP_Affjax_Response.responseType(__dict_Respondable_2);
                          if (_32 instanceof Network_HTTP_Affjax_Response.JSONResponse) {
                              return Control_Bind["<=<"](Data_Either.bindEither)(Network_HTTP_Affjax_Response.fromResponse(__dict_Respondable_2))(Control_Bind["<=<"](Data_Either.bindEither)(Data_Foreign.parseJSON)(Data_Foreign.readString));
                          };
                          return Network_HTTP_Affjax_Response.fromResponse(__dict_Respondable_2);
                      })();
                      var cb$prime = function (res) {
                          var _35 = Prelude["<$>"](Data_Either.functorEither)(function (_0) {
                              var _33 = {};
                              for (var _34 in res) {
                                  if (res.hasOwnProperty(_34)) {
                                      _33[_34] = res[_34];
                                  };
                              };
                              _33.response = _0;
                              return _33;
                          })(fromResponse$prime(res.response));
                          if (_35 instanceof Data_Either.Left) {
                              return eb(Control_Monad_Eff_Exception.error(Prelude.show(Data_Foreign.showForeignError)(_35.value0)));
                          };
                          if (_35 instanceof Data_Either.Right) {
                              return cb(_35.value0);
                          };
                          throw new Error("Failed pattern match at Network.HTTP.Affjax line 197, column 1 - line 202, column 1: " + [ _35.constructor.name ]);
                      };
                      return $foreign._ajax(Network_HTTP_ResponseHeader.responseHeader, req$prime, cancelAjax, eb, cb$prime);
                  };
              };
          };
      };
  };
  var affjax = function (__dict_Requestable_3) {
      return function (__dict_Respondable_4) {
          return function (_51) {
              return Control_Monad_Aff["makeAff'"](affjax$prime(__dict_Requestable_3)(__dict_Respondable_4)(_51));
          };
      };
  };
  var post = function (__dict_Requestable_7) {
      return function (__dict_Respondable_8) {
          return function (u) {
              return function (c) {
                  return affjax(__dict_Requestable_7)(__dict_Respondable_8)((function () {
                      var _42 = {};
                      for (var _43 in defaultRequest) {
                          if (defaultRequest.hasOwnProperty(_43)) {
                              _42[_43] = defaultRequest[_43];
                          };
                      };
                      _42.method = Network_HTTP_Method.POST.value;
                      _42.url = u;
                      _42.content = new Data_Maybe.Just(c);
                      return _42;
                  })());
              };
          };
      };
  };
  exports["post"] = post;
  exports["affjax"] = affjax;
  exports["defaultRequest"] = defaultRequest;;
 
})(PS["Network.HTTP.Affjax"] = PS["Network.HTTP.Affjax"] || {});
(function(exports) {
  // Generated by psc version 0.7.6.1
  "use strict";
  var Halogen_HTML_Elements = PS["Halogen.HTML.Elements"];
  var Halogen_HTML = PS["Halogen.HTML"];
  var Halogen_HTML_Elements_Indexed = PS["Halogen.HTML.Elements.Indexed"];
  var Halogen_HTML_Events = PS["Halogen.HTML.Events"];
  var Halogen_Query = PS["Halogen.Query"];
  var Halogen_Component = PS["Halogen.Component"];
  var Halogen_Driver = PS["Halogen.Driver"];
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Data_Either = PS["Data.Either"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Foreign_Class = PS["Data.Foreign.Class"];
  var Data_Functor = PS["Data.Functor"];
  var Data_Maybe = PS["Data.Maybe"];
  var Halogen = PS["Halogen"];
  var Halogen_Util = PS["Halogen.Util"];
  var Halogen_HTML_Indexed = PS["Halogen.HTML.Indexed"];
  var Halogen_HTML_Events_Indexed = PS["Halogen.HTML.Events.Indexed"];
  var Halogen_HTML_Properties_Indexed = PS["Halogen.HTML.Properties.Indexed"];
  var Network_HTTP_Affjax = PS["Network.HTTP.Affjax"];
  var Network_HTTP_Affjax_Request = PS["Network.HTTP.Affjax.Request"];
  var Network_HTTP_Affjax_Response = PS["Network.HTTP.Affjax.Response"];
  var Data_Foreign_Index = PS["Data.Foreign.Index"];
  var Data_Monoid = PS["Data.Monoid"];
  var Control_Monad_Free = PS["Control.Monad.Free"];
  var Control_Monad_Aff_Class = PS["Control.Monad.Aff.Class"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];     
  var SetCode = (function () {
      function SetCode(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      SetCode.create = function (value0) {
          return function (value1) {
              return new SetCode(value0, value1);
          };
      };
      return SetCode;
  })();
  var MakeRequest = (function () {
      function MakeRequest(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      MakeRequest.create = function (value0) {
          return function (value1) {
              return new MakeRequest(value0, value1);
          };
      };
      return MakeRequest;
  })();
  var fetchJS = function (code) {
      return Prelude.bind(Control_Monad_Aff.bindAff)(Network_HTTP_Affjax.post(Network_HTTP_Affjax_Request.requestableString)(Network_HTTP_Affjax_Response.responsableJSON)("http://try.purescript.org/compile/text")(code))(function (_4) {
          return Prelude["return"](Control_Monad_Aff.applicativeAff)((function () {
              var _8 = Control_Alt["<|>"](Data_Either.altEither)(Data_Foreign_Class.readProp(Data_Foreign_Class.stringIsForeign)(Data_Foreign_Index.indexString)("js")(_4.response))(Data_Foreign_Class.readProp(Data_Foreign_Class.stringIsForeign)(Data_Foreign_Index.indexString)("error")(_4.response));
              if (_8 instanceof Data_Either.Right) {
                  return _8.value0;
              };
              if (_8 instanceof Data_Either.Left) {
                  return "Invalid response";
              };
              throw new Error("Failed pattern match at Main line 94, column 1 - line 95, column 1: " + [ _8.constructor.name ]);
          })());
      });
  };
  var ui = (function () {
      var render = function (st) {
          return Halogen_HTML_Elements.div_(Prelude["++"](Prelude.semigroupArray)([ Halogen_HTML_Elements.h1_([ Halogen_HTML.text("ajax example / trypurescript") ]), Halogen_HTML_Elements.h2_([ Halogen_HTML.text("purescript input:") ]), Halogen_HTML_Elements.p_([ Halogen_HTML_Elements_Indexed.textarea([ Halogen_HTML_Properties_Indexed.value(st.code), Halogen_HTML_Events_Indexed.onValueInput(Halogen_HTML_Events.input(SetCode.create)) ]) ]), Halogen_HTML_Elements.p_([ Halogen_HTML_Elements_Indexed.button([ Halogen_HTML_Properties_Indexed.disabled(st.busy), Halogen_HTML_Events_Indexed.onClick(Halogen_HTML_Events.input_(MakeRequest.create(st.code))) ])([ Halogen_HTML.text("Compile") ]) ]), Halogen_HTML_Elements.p_([ Halogen_HTML.text((function () {
              if (st.busy) {
                  return "Working...";
              };
              if (!st.busy) {
                  return "";
              };
              throw new Error("Failed pattern match at Main line 85, column 3 - line 86, column 3: " + [ st.busy.constructor.name ]);
          })()) ]) ])(Prelude.flip(Data_Foldable.foldMap(Data_Foldable.foldableMaybe)(Data_Monoid.monoidArray))(st.result)(function (js) {
              return [ Halogen_HTML_Elements.div_([ Halogen_HTML_Elements.h2_([ Halogen_HTML.text("javascript output:") ]), Halogen_HTML_Elements.pre_([ Halogen_HTML_Elements.code_([ Halogen_HTML.text(js) ]) ]) ]) ];
          })));
      };
      var $$eval = function (_6) {
          if (_6 instanceof SetCode) {
              return Data_Functor["$>"](Control_Monad_Free.freeFunctor)(Halogen_Query.modify(function (_0) {
                  var _13 = {};
                  for (var _14 in _0) {
                      if (_0.hasOwnProperty(_14)) {
                          _13[_14] = _0[_14];
                      };
                  };
                  _13.code = _6.value0;
                  _13.result = Data_Maybe.Nothing.value;
                  return _13;
              }))(_6.value1);
          };
          if (_6 instanceof MakeRequest) {
              return Prelude.bind(Control_Monad_Free.freeBind)(Halogen_Query.modify(function (_1) {
                  var _17 = {};
                  for (var _18 in _1) {
                      if (_1.hasOwnProperty(_18)) {
                          _17[_18] = _1[_18];
                      };
                  };
                  _17.busy = true;
                  return _17;
              }))(function () {
                  return Prelude.bind(Control_Monad_Free.freeBind)(Halogen_Query["liftAff'"](Control_Monad_Aff_Class.monadAffAff)(fetchJS(_6.value0)))(function (_3) {
                      return Prelude.bind(Control_Monad_Free.freeBind)(Halogen_Query.modify(function (_2) {
                          var _20 = {};
                          for (var _21 in _2) {
                              if (_2.hasOwnProperty(_21)) {
                                  _20[_21] = _2[_21];
                              };
                          };
                          _20.busy = false;
                          _20.result = new Data_Maybe.Just(_3);
                          return _20;
                      }))(function () {
                          return Prelude.pure(Control_Monad_Free.freeApplicative)(_6.value1);
                      });
                  });
              });
          };
          throw new Error("Failed pattern match at Main line 49, column 1 - line 50, column 1: " + [ _6.constructor.name ]);
      };
      return Halogen_Component.component(render)($$eval);
  })();
  var exampleCode = "module Main where\nimport Prelude\nimport Control.Monad.Eff.Console (print)\nfact :: Int -> Int\nfact 0 = 1\nfact n = n * fact (n - 1)\nmain = print (fact 20)\n";
  var initialState = {
      busy: false, 
      code: exampleCode, 
      result: Data_Maybe.Nothing.value
  };
  var main = Control_Monad_Aff.runAff(Control_Monad_Eff_Exception.throwException)(Prelude["const"](Prelude.pure(Control_Monad_Eff.applicativeEff)(Prelude.unit)))(Prelude.bind(Control_Monad_Aff.bindAff)(Halogen_Driver.runUI(ui)(initialState))(function (_5) {
      return Halogen_Util.onLoad(Control_Monad_Aff.monadEffAff)(Halogen_Util.appendToBody(Control_Monad_Eff_Class.monadEffEff)(_5.node));
  }));
  exports["SetCode"] = SetCode;
  exports["MakeRequest"] = MakeRequest;
  exports["main"] = main;
  exports["fetchJS"] = fetchJS;
  exports["ui"] = ui;
  exports["exampleCode"] = exampleCode;
  exports["initialState"] = initialState;;
 
})(PS["Main"] = PS["Main"] || {});

PS["Main"].main();
},{"virtual-dom/create-element":15,"virtual-dom/diff":16,"virtual-dom/patch":17,"virtual-dom/virtual-hyperscript/hooks/soft-set-hook":24,"virtual-dom/vnode/vnode":32,"virtual-dom/vnode/vtext":34}]},{},[38]);
