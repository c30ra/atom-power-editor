'use babel';

import {CompositeDisposable} from 'atom';
import {Point} from 'atom';

const parser = require('./parser');

/**
 * add trailing zeros to number
 * @param  {int} num  [the number to add zeros]
 * @param  {int} size [number of zeros to add]
 * @return {string}      [a number with trailing zeros]
 */
function pad(num, size) {
    let s = num+'';
    for(let i = 0; i < size; i++) {
      s = '0' + s;
    }
    return s;
}
/**
 * increment or decrement the passed value
 * @param  {string} value     [the value to apply the function]
 * @param  {String} operation [the type of operation to apply,
 *                             possible values: increment, decrement]
 * @return {string}
 * */
function applyValueTransform(value, operation='increment') {
  let transform = null;

  if(operation == 'increment') {
    transform = (_value) => {
      return ++_value;
    };
  } else {
    transform = (_value) => {
    return _value == 0 ? 0 : _value - 1;
    };
  }

  let matches = value.match(/([0]+)([0-9]+)/);
  // there are leadingZero
  if(matches) {
    let leadingZero = matches[1].length;
    value = Number(matches[2]);
    value = transform(value);
    value = pad(value, leadingZero);
  } else {
    value = Number(value);
    value = transform(value);
  }
  return value;
}

/**
 * duplicate text and apply operation if possible
 * @param  {String} text
 * @param  {String} operation [description]
 * @return {[type]}           [description]
 */
function smartDuplication(text, operation='increment') {
  let parsedObj = null;
  // text contain number and/or array index access
  // so we parse it and perform operation the number
  try{
       parsedObj = parser.parse(text);

       let object = parsedObj['lvalue'];
       let valueName = object['name'];
       let value = applyValueTransform(object['value'], operation);
       text = text.replace(object['fullname'], valueName + value);

       object = parsedObj['rvalue'];
       if(object) {
         valueName = object['name'];
         value = object['value'];
         value = applyValueTransform(value, operation);
         text = text.replace(object['fullname'],
                             valueName+'['+value+']');
       }
       return text;
    } catch(e) {
    // no smart duplication
    return text;
  }
}

/**
 * Copy a single line of text
 * @param  {Editor} editor
 * @return {String}
 */
function singleLineCopy(editor) {
  editor.moveToBeginningOfLine();
  editor.selectToEndOfLine();

  return editor.getSelectedText();
}

/**
 * Copy multiple line of test
 * @param  {Editor} editor    [description]
 * @param  {Selection} selection [description]
 * @return {String}           [description]
 */
function multiLineCopy(editor, selection) {
  editor.setCursorBufferPosition(selection.start);
  editor.moveToBeginningOfLine();
  editor.selectToBufferPosition(selection.end);
  editor.selectToEndOfLine();
  let text = editor.getSelectedText();

  // restore the cursor to start of selection
  editor.setCursorBufferPosition(selection.start);

  return text;
}


export default {

  config: {
    useSmartDuplication: {
      description: 'Allow to increment/decrement variable names' +
                   'and/or array index(k[])',
      type: 'boolean',
      default: true,
      order: 1,
    },
  },

  activate(state) {
    console.log('power-editor: ready');

    // Events subscribed to in atom's system can be easily cleaned
    // up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'power-editor:duplicate-line-up': () => this.duplicateLine('up'),
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'power-editor:duplicate-line-down': () => this.duplicateLine('down'),
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'power-editor:switch-list-item-forward': () => this.switchlistItem('right'),
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'power-editor:switch-list-item-backward': () => this.switchlistItem('left'),
    }));
  },

  deactivate() {
      this.subscriptions.dispose();
    },

  serialize() {
  },

  duplicateLine(direction) {
    // TODO: move to settings
    let useSmartDuplication =
        atom.config.get('power-editor.useSmartDuplication');

    let editor = null;

    if (editor = atom.workspace.getActiveTextEditor()) {
      let operation = direction == 'up' ? 'decrement' : 'increment';
      let cursorPosition = editor.getCursorBufferPosition();
      // check if there is already a selection
      let selection = editor.getSelectedBufferRange();
      let text = null;

      if(selection.isEmpty() || selection.getRowCount() == 1) {
        text = singleLineCopy(editor);
        if(useSmartDuplication) {
          text = smartDuplication(text, operation);
        }
      } else {
      // multi-line text copy
        text = multiLineCopy(editor, selection);
        if(direction == 'up') {
          editor.setCursorBufferPosition(selection.start);
        } else {
          editor.setCursorBufferPosition(selection.end);
        }
      }

      // perform duplication
      if(text == null) {
        editor.setCursorBufferPosition(cursorPosition);
        return;
      }

      let chkp = editor.createCheckpoint();
      direction == 'up' ? editor.insertNewlineAbove()
                        : editor.insertNewlineBelow();
      editor.moveToBeginningOfLine();
      editor.insertText(text, {select: true});
      // accumulate operation, for undo
      editor.groupChangesSinceCheckpoint(chkp);
    }
  },

    switchlistItem(direction) {
    // TODO : regex matcher /[\w]+(\s[\w]+)?(\s)*(?:,\s*[\w]+(\s[\w]+)?(\s)*)+/

    let editor = null;

    if (editor = atom.workspace.getActiveTextEditor()) {
      let cursorPosition = editor.getCursorBufferPosition();
      let chkp = editor.createCheckpoint();
      // start check if we are in a list
      editor.moveToBeginningOfLine();
      editor.selectToEndOfLine();
      let line = editor.getSelectedText();

      // we found a match
      const regex = /(\b[\w\s]+\b)(?:\s*,\s*(\b[\w\s]+\b)+)/g;
      let m;
      let itemInList = [];
      while ((m = regex.exec(line)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
              regex.lastIndex++;
          }

          if(cursorPosition.column >= m.index &&
            cursorPosition.column <= m.index + m[0].length) {
              m.forEach((match, groupIndex) => {
                let item = {};
                item.startIndex = line.indexOf(match, m.index);
                item.endIndex = match.length + line.indexOf(match, m.index);
                item.data = match;
                itemInList.push(item);
              });
              break;
            }
      }

      if(!itemInList) {
        editor.setCursorBufferPosition(cursorPosition);
        return;
      }
      // remove the full match from the list
      // keeping only sub-match(item of the list)
      itemInList.shift();

      // find the selectedWord
      let selectedItem = null;
      itemInList.forEach((item) => {
        if(cursorPosition.column >= item.startIndex
          && cursorPosition.column <= item.endIndex) {
          selectedItem = item;
        }
      });

      let index = itemInList.indexOf(selectedItem);
      let targetItem;

      if(direction == 'left') {
        targetItem = itemInList[index - 1];
      } else {
        targetItem = itemInList[index + 1];
      }

      let selectedWordStart = new Point(cursorPosition.row,
        selectedItem.startIndex);

      let selectedWordEnd = new Point(cursorPosition.row,
        selectedItem.endIndex);

      let selectedWord = selectedItem.data;

      let targetWord = targetItem.data;
      // return back to previous word
      editor.setCursorBufferPosition(selectedWordStart);
      editor.selectToBufferPosition(selectedWordEnd);
      // replace selected word with target one
      editor.insertText(targetWord);
      // switch with to target word
      let delta = direction == 'left' ? 0
                                      : selectedWord.length - targetWord.length;

      let targetWordStart = new Point(cursorPosition.row,
        targetItem.startIndex - delta);

      let targetWordEnd = new Point(cursorPosition.row,
        targetItem.endIndex - delta);

      editor.setCursorBufferPosition(targetWordStart);
      editor.selectToBufferPosition(targetWordEnd);
      // replace with selected one
      editor.insertText(selectedWord, {select: true});

      editor.groupChangesSinceCheckpoint(chkp);
    }
  },
};
