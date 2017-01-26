'use babel';

import PowerEditor from '../lib/power-editor';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('PowerEditor', () => {
  let workspaceElement, activationPromise, editor;

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.workspace.open();
    });

    runs(() => {
      editor = atom.workspace.getActiveTextEditor();
      workspaceElement = atom.views.getView(editor);
    });

    activationPromise = atom.packages.activatePackage('power-editor');
  });

  describe("when atom load",() => {
    it("package is activated", () =>
    {
      // atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-up');
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        expect(atom.packages.isPackageActive('power-editor')).toBe(true);

      });
    });
  });

/******************************************************************************
* DUPLICATE LINES UP TESTS
* ****************************************************************************/

  describe('when the power-editor:duplicate-line-up event is triggered', () => {
    it('duplicate a single line up', () => {
      // This is an activation event, triggering it will cause the package to be
      // activated.
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("single line of text")

        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-up');
        editor.moveUp(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("single line of text");
      });
    });

    it('duplicate-smart a single line up', () => {
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var10")

        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-up');
        editor.moveUp(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("var9");
      });
    });

    it("duplicate-smart a single line up, don't go below zero", () => {
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var0")

        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-down');
        editor.moveUp(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("var0");
      });
    });

    it('duplicate-no-smart a single line up', () => {
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var10")

        atom.config.set("power-editor.useSmartDuplication", false)
        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-up');
        editor.moveUp(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("var10");
      });
    });
  });

  /******************************************************************************
  * DUPLICATE LINES DOWN TESTS
  * ****************************************************************************/

  describe('when the power-editor:duplicate-line-down event is triggered', () => {
    it('duplicate a single line up', () => {
      // This is an activation event, triggering it will cause the package to be
      // activated.
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("single line of text")

        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-down');
        editor.moveDown(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("single line of text");
      });
    });

    it('duplicate-smart a single line up', () => {
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var1")

        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-down');
        editor.moveDown(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("var2");
      });
    });

    it('duplicate-no-smart a single line down', () => {
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var1")

        atom.config.set("power-editor.useSmartDuplication", false)
        atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-down');
        editor.moveDown(1)
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(editor.getLineCount()).toBe(2);
        expect(txt).toBe("var1");
      });
    });
  });

  /******************************************************************************
  * SWITCH LIST ITEM FORWARD
  * ****************************************************************************/

  describe("when power-editor:switch-list-item-forward is triggered",() => {
    it("switch a item in list with next item", () =>
    {
      // atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-up');
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var1, var2")
        editor.moveToBeginningOfLine()
        atom.commands.dispatch(workspaceElement, 'power-editor:switch-list-item-forward');
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(txt).toBe("var2, var1");
      });
    });

    it("switch a item in list with previous item", () =>
    {
      // atom.commands.dispatch(workspaceElement, 'power-editor:duplicate-line-up');
      waitsForPromise(() => atom.packages.activatePackage('power-editor'));

      runs(() => {
        editor.insertText("var2, var1")
        // ensure we are inside the word
        editor.moveToEndOfLine()
        editor.moveLeft(2);    
        // exute the command
        atom.commands.dispatch(workspaceElement, 'power-editor:switch-list-item-backward');
        editor.moveToBeginningOfLine()
        editor.selectToEndOfLine();
        let txt = editor.getSelectedText()
        expect(txt).toBe("var1, var2");
      });
    });
  });
});
