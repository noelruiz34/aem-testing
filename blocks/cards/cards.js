import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);

  const commerceResources = document.querySelector('.resources ul');
  let template = document.querySelector('.resources ul li');
  fetch('./helix-commerce-resources.json')
    .then((res) => res.text())
    .then((text) => {
      const resources = JSON.parse(text);
      resources.data.forEach((item) => {
        if (item.visible === 'true') {
          const section = template.querySelector('.cards-card-body:first-child');
          section.innerHTML = '';

          const pTitle = document.createElement('p');
          pTitle.innerText = item.ProgramName;

          const pImage = document.createElement('p');
          pImage.innerHTML = `<picture><img alt src="./${item.IconLocation}" ></picture>`;
          section.append(pTitle, pImage);

          const sectionBody = template.querySelector('.cards-card-body:last-child');
          const pText = document.createElement('p');
          pText.innerText = item.Text;

          const pLink = document.createElement('p');
          pLink.innerHTML = `<em><a title="Learn More" class="button secondary" href= "${item.Url}">Learn More</a></em>`;

          const hr = document.createElement('hr');
          sectionBody.innerHTML = '';
          sectionBody.append(pText, hr, pLink);
          commerceResources.appendChild(template);
          template = template.cloneNode(true);
        }
      });
    })
    .catch();
}
