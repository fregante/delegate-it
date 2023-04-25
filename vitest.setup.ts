import {JSDOM} from 'jsdom';

const {window} = new JSDOM(`
	<ul>
		<li><a>Item 1</a></li>
		<li><a>Item 2</a></li>
		<li><a>Item 3</a></li>
		<li><a>Item 4</a></li>
		<li><a>Item 5</a></li>
	</ul>
`);

global.Text = window.Text;
global.Event = window.Event;
global.Element = window.Element;
global.Document = window.Document;
global.MouseEvent = window.MouseEvent;
global.AbortController = window.AbortController;
global.document = window.document;
export const base = window.document.querySelector('ul')!;
export const anchor = window.document.querySelector('a')!;
