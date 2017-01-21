'use babel';

import { CompositeDisposable } from 'atom';
const parser = require('./parser');

function pad(num, size) {
    var s = num+"";
    for(var i = 0; i < size; i++) {
      s = "0" + s;
    }
    return s;
}

function applyValueTransform(value, operation='increment'){
  let transform = null

  if(operation == 'increment'){
    transform = (_value) => {return ++_value};
  }
  else{
    transform = (_value) => {return _value == 0 ? 0 : _value - 1};
  }

  let matches = value.match(/([0]+)([0-9]+)/)
  // there are leadingZero
  if(matches){
    let leadingZero = matches[1].length
    value = Number(matches[2])
    value = transform(value)
    value = pad(value, leadingZero)
  }
  else {
    value = Number(value)
    value = transform(value)
  }
  return value
}
/* duplicate 'text' and apply 'operation' if possible,
 * else return 'text'
 */
function smartDuplication(text, operation='increment'){
  let parsedObj = null
  // text contain number and/or array index acess
  // so we parse it and perform operation the number
  try{
       parsedObj = parser.parse(text)

       let object = parsedObj["lvalue"]
       let value_name = object["name"]
       let value = applyValueTransform(object["value"], operation)
       text = text.replace(object["fullname"], value_name + value)

       object = parsedObj["rvalue"]
       if(object){
         value_name = object["name"]
         value = object["value"]
         value = applyValueTransform(value, operation)
         text = text.replace(object["fullname"],
                             value_name+"["+value+"]")
       }
       return text
    }
    // no smart duplication
  catch(e){
    return text
  }
}

function singleLineCopy(editor){
  editor.moveToFirstCharacterOfLine();
  editor.selectToEndOfLine();

  return editor.getSelectedText();
}

function multiLineCopy(editor){
  editor.setCursorBufferPosition(selection.start);
  editor.moveToFirstCharacterOfLine();
  editor.selectToBufferPosition(selection.end);
  let text = editor.getSelectedText();

  // restore the cursor to start of selection
  editor.setCursorBufferPosition(selection.start)

  return text
}

export default {

  config: {
    useSmartDuplication: {
      description: "Allow to increment/decremnt variable names and or \
                    array index(k[])",
      type: "boolean",
      default: true,
      order: 1
    }
  },

  activate(state) {
    console.log("power-editor: ready")

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
    'power-editor:duplicateLineUp' : () => this.duplicateLine('up')
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
    'power-editor:duplicateLineDown' : () => this.duplicateLine()
    }));
  },

  deactivate() {
      this.subscriptions.dispose();
    },

  serialize() {
  },

  duplicateLine(direction: 'down') {
    // TODO: move to settings
    let useSmartDuplication = true
    let editor = null

    if (editor = atom.workspace.getActiveTextEditor()) {

      let operation = direction == 'up' ? 'decrement' : 'increment';
      let curCursorPosition = editor.getCursorBufferPosition()
      // check if there is already a selection
      let selection = editor.getSelectedBufferRange()
      let text = null

      if(selection.isEmpty() || selection.getRowCount() == 1) {
        text = singleLineCopy(editor)
        if(useSmartDuplication){
          text = smartDuplication(text, operation)
        }
      }
      // multiline text copy
      else {
        text = multiLineCopy(editor)
      }

      // perform duplication
      if(text == null){
        return
      }

      let chkp = editor.createCheckpoint()
      direction == 'up' ? editor.insertNewlineAbove() : editor.insertNewlineBelow()
      // editor.moveToBeginningOfLine()
      editor.insertText(text, {select:true})
      //acumulate operation, for undo
      editor.groupChangesSinceCheckpoint(chkp)
    }
  },

};
