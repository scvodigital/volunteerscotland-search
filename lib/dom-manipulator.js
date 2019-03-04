import * as mustache from 'mustache';

export default function domManipulator(rules, root, data) {
  //TODO: Pivot this, group things by selector. Will make things tidier
  if (rules.addClasses) {
    rulesIterator(rules.addClasses, root, (element, classes) => {
      for (let className of classes) {
        className = mustache.render(className, data);
        element.classList.add(className);
      }
    });
  }

  if (rules.removeClasses) {
    rulesIterator(rules.removeClasses, root, (element, classes) => {
      for (let className of classes) {
        className = mustache.render(className, data);
        element.classList.remove(className);
      }
    });
  }

  if (rules.attributes) {
    rulesIterator(rules.attributes, root, (element, attributes) => {
      for (const attribute of Object.keys(attributes)) {
        let value = attributes[attribute];
        if (value === null && element.attributes.hasOwnProperty(attribute)) {
          element.attributes.removeNamedItem(attribute);
        } else {
          value = mustache.render(value, data);
          element.setAttribute(attribute, value);
        }
      }
    });
  }

  if (rules.contents) {
    rulesIterator(rules.contents, root, (element, contents) => {
      contents = mustache.render(contents, data);
      element.innerHTML = contents;
    });
  }

  if (rules.styles) {
    rulesIterator(rules.styles, root, (element, styles) => {
      for (const property of Object.keys(styles)) {
        const value = mustache.render(styles[property], data);
        element.style[property] = value;
      }
    });
  }

  if (rules.deleteElements) {
    rulesIterator(rules.deleteElements, root, (element) => {
      element.remove();
    });  
  }

  if (rules.createElements) {
    rulesIterator(rules.createElements, root, (element, config) => {
      const where = config.where || element.children.length;
      const tagName = config.tagName || 'div';
      const newElement = document.createElement(tagName);
      if (config.attributes) {
        for (const attribute of Object.keys(config.attributes)) {
          const value = mustache.render(config.attributes[attribute], data);
          newElement.setAttribute(attribute, value);
        }
      }
      if (config.template || config.html) {
        const contents = config.html || mustache.render(config.template, data);
        newElement.innerHTML = contents;
      }
      element.insertBefore(newElement, element.children[where]);
    });
  }

  if (rules.delayed) {
    for (const delay of Object.keys(rules.delayed)) {
      const delayedRules = rules.delayed[delay];
      const delayParsed = Number(delay) || 0;
      setTimeout(() => {
        domManipulator(delayedRules, root, data);
      }, delayParsed);
    }
  }

  if (rules.run) {
    const funcs = Array.isArray(rules.run) ? rules.run : [rules.run];
    for (const func of funcs) {
      try {
        safeEval(func);
      } catch(err) {
        console.error('Failed to safely evaluate Dom Manipulator rule', err);
      }
    }
  }

  function safeEval(fn) {
    return Function('"use strict"; return (' + fn + ')')()(data);
  }
  
  function rulesIterator(items, root, callback) {
    const isArray = Array.isArray(items);
    const collection = isArray ? items : Object.keys(items);
    for (const selector of collection) {
      const data = isArray ? null : items[selector];
      let elements = [];
      if (selector === '>') {
        elements = [root];
      } else if (selector.indexOf('>') === 0) {
        elements = root.querySelectorAll(selector.substr(1));
      } else {
        elements = document.querySelectorAll(selector);
      }
      for (const element of elements) {
        callback(element, data);
      }
    }
  }
}