import { Component, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-hierarchy-mapper',
  standalone: true,
  templateUrl: './hierarchy-mapper.component.html',
  styleUrls: [
    './styles.css',
    './dim-styles.css',
    './import-styles.css'
  ],
  encapsulation: ViewEncapsulation.None
})
export class HierarchyMapperComponent implements AfterViewInit, OnDestroy {
  private scriptElements: HTMLScriptElement[] = [];

  private readonly scripts = [
    'constants.js',
    'data-model.js',
    'app.js',
    'modals.js',
    'dimensions.js',
    'dim-settings-modal.js',
    'account-props.js',
    'account-pool.js',
    'hierarchy-tree.js',
    'drag-drop.js',
    'import-export.js',
    'import-accounts.js',
    'sample-data.js',
    'preview.js',
    'undo-redo.js',
    'panel-resize.js'
  ];

  ngAfterViewInit(): void {
    this.cleanup();
    this.loadScriptsSequentially(0);
  }

  private initApp(): void {
    const win = window as any;
    win.app = new win.App();
    win.app.initUndoRedo();
    win.app.init();
  }

  private cleanup(): void {
    const win = window as any;
    if (win.app) {
      delete win.app;
    }
    // Remove any previously injected hierarchy-mapper scripts
    document.querySelectorAll('script[src^="hierarchy-mapper/"]').forEach(el => el.remove());
  }

  ngOnDestroy(): void {
    // Clean up global app instance
    const win = window as any;
    if (win.app) {
      delete win.app;
    }
    // Remove injected script tags
    this.scriptElements.forEach(el => el.remove());
    this.scriptElements = [];
  }

  private loadScriptsSequentially(index: number): void {
    if (index >= this.scripts.length) return;

    const script = document.createElement('script');
    script.src = `hierarchy-mapper/${this.scripts[index]}`;
    script.onload = () => {
      if (index + 1 >= this.scripts.length) {
        this.initApp();
      } else {
        this.loadScriptsSequentially(index + 1);
      }
    };
    script.onerror = () => {
      console.error(`Failed to load: ${this.scripts[index]}`);
      this.loadScriptsSequentially(index + 1);
    };
    document.body.appendChild(script);
    this.scriptElements.push(script);
  }
}
