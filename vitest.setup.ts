import {JSDOM} from 'jsdom';
import delegate from './delegate.js';

const {window} = new JSDOM();

global.Text = window.Text;
global.Event = window.Event;
global.Element = window.Element;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;
global.Document = window.Document;
global.MouseEvent = window.MouseEvent;
global.AbortController = window.AbortController;
global.document = window.document;

class CustomElement extends HTMLElement {
	public linksClicked = 0;

	connectedCallback(): void {
		const shadow = this.attachShadow({mode: 'open'});
		shadow.innerHTML = '<p><a>First link</a></p><p><a>Second link</a></p>';

		delegate('a', 'click', () => this.linksClicked++, {base: shadow});
	}

	clickLinks(): void {
		for (const element of this.shadowRoot.querySelectorAll('a')) {
			element.dispatchEvent(new MouseEvent('click', {bubbles: true}));
		}
	}
}

window.customElements.define('custom-element', CustomElement);

window.document.documentElement.innerHTML = `
	<ul>
		<li><a>Item 1</a></li>
		<li><a>Item 2</a></li>
		<li><a>Item 3</a></li>
		<li><a>Item 4</a></li>
		<li><a>Item 5</a></li>
		<li><custom-element></custom-element></li>
	</ul>
`;

export const base = window.document.querySelector('ul')!;
export const anchor = window.document.querySelector('a')!;
export const custom = window.document.querySelector<CustomElement>('custom-element')!;
