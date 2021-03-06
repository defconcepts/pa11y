// This file is part of pa11y.
//
// pa11y is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// pa11y is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with pa11y.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

function injectPa11y(window, options, done) {
	// jshint maxstatements: false

	var messageTypeMap = {
		1: 'error',
		2: 'warning',
		3: 'notice'
	};

	setTimeout(runCodeSniffer, options.wait);

	function runCodeSniffer() {
		try {
			window.HTMLCS.process(options.standard, window.document, onCodeSnifferComplete);
		} catch (error) {
			reportError('HTML CodeSniffer: ' + error.message);
		}
	}

	function onCodeSnifferComplete() {
		done({
			messages: processMessages(window.HTMLCS.getMessages())
		});
	}

	function processMessages(messages) {
		return messages.map(processMessage).filter(isMessageWanted);
	}

	function processMessage(message) {
		return {
			code: message.code,
			context: processMessageHtml(message.element),
			message: message.msg,
			type: (messageTypeMap[message.type] || 'unknown'),
			typeCode: message.type,
			selector: getCssSelectorForElement(message.element)
		};
	}

	function processMessageHtml(element) {
		var outerHTML = null;
		var innerHTML = null;
		if (!element.outerHTML) {
			return outerHTML;
		}
		outerHTML = element.outerHTML;
		if (element.innerHTML.length > 31) {
			innerHTML = element.innerHTML.substr(0, 31) + '...';
			outerHTML = outerHTML.replace(element.innerHTML, innerHTML);
		}
		if (outerHTML.length > 251) {
			outerHTML = outerHTML.substr(0, 250) + '...';
		}
		return outerHTML;
	}

	function getCssSelectorForElement(element, selectorParts) {
		selectorParts = selectorParts || [];
		if (isElementNode(element)) {
			var identifier = buildElementIdentifier(element);
			selectorParts.unshift(identifier);
			if (!element.id && element.parentNode) {
				return getCssSelectorForElement(element.parentNode, selectorParts);
			}
		}
		return selectorParts.join(' > ');
	}

	function buildElementIdentifier(element) {
		if (element.id) {
			return '#' + element.id;
		}
		var identifier = element.tagName.toLowerCase();
		if (!element.parentNode) {
			return identifier;
		}
		var siblings = getSiblings(element);
		var childIndex = siblings.indexOf(element);
		if (!isOnlySiblingOfType(element, siblings) && childIndex !== -1) {
			identifier += ':nth-child(' + (childIndex + 1) + ')';
		}
		return identifier;
	}

	function getSiblings(element) {
		return Array.prototype.slice.call(element.parentNode.childNodes).filter(isElementNode);
	}

	function isOnlySiblingOfType(element, siblings) {
		var siblingsOfType = siblings.filter(function(sibling) {
			return (sibling.tagName === element.tagName);
		});
		return (siblingsOfType.length <= 1);
	}

	function isElementNode(element) {
		return (element.nodeType === 1);
	}

	function isMessageWanted(message) {
		if (options.ignore.indexOf(message.code.toLowerCase()) !== -1) {
			return false;
		}
		if (options.ignore.indexOf(message.type) !== -1) {
			return false;
		}
		return true;
	}

	function reportError(message) {
		done({
			error: message
		});
	}

}

/* istanbul ignore next */
if (typeof module !== 'undefined' && module.exports) {
	module.exports = injectPa11y;
}
