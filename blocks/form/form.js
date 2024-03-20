import createField from './form-fields.js';
import { sampleRUM } from '../../scripts/aem.js';

function updateTotal(block, e) {
  const element = block.querySelector(`.${e.target.name}`);
  element.innerText = (e.target.type === 'checkbox') ? e.target.checked : e.target.value;
}

function addPriceBox(element) {
  const summaryBlock = document.createElement('div');
  summaryBlock.classList.add('order-summary', 'field-wrapper');

  const formElements = document.querySelectorAll('[data-fieldset = "product"]');

  formElements.forEach((item) => {
    const fieldName = item.firstChild.name;
    const fieldValue = item.firstChild.value;
    const summaryItem = document.createElement('div');

    summaryItem.innerHTML = `
    <div>
      <div> ${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} </div>
      <div class="${fieldName}"> ${(item.firstChild.type === 'checkbox') ? item.firstChild.checked : fieldValue || 'not selected'} </div>
    </div>
  `;
    summaryBlock.appendChild(summaryItem);
  });

  element.parentNode.insertBefore(summaryBlock, element);
}

function bindEvents(block) {
  const form = block.querySelector('form');
  form.addEventListener('change', (e) => {
    updateTotal(block, e);
  });
}

function moveForm(block) {
  const parent = document.querySelector('.columns.product-details > div');
  const contactVendor = parent.querySelector('.button-container');
  contactVendor.classList.add('field-wrapper');
  block.querySelector('form').appendChild(contactVendor);
  const form = block.parentNode;
  parent.appendChild(form);
  addPriceBox(block.querySelector('.submit-wrapper'));
}

async function createForm(formHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement('form');
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];

  const fields = await Promise.all(json.data.map((fd) => createField(fd, form)));
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  // group fields into fieldsets
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"`).forEach((field) => {
      fieldset.append(field);
    });
  });

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

function handleSubmitError(form, error) {
  // eslint-disable-next-line no-console
  console.error(error);
  form.querySelector('button[type="submit"]').disabled = false;
  sampleRUM('form:error', { source: '.form', target: error.stack || error.message || 'unknown error' });
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    submit.disabled = true;

    // create payload
    const payload = generatePayload(form);
    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      sampleRUM('form:submit', { source: '.form', target: form.dataset.action });
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
      }
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    handleSubmitError(form, e);
  } finally {
    form.setAttribute('data-submitting', 'false');
  }
}

export default async function decorate(block) {
  const formLink = block.querySelector('a[href$=".json"]');
  if (!formLink) return;

  const form = await createForm(formLink.href);
  block.replaceChildren(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  moveForm(block);
  bindEvents(block);
}
