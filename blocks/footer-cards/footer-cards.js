export default function decorate(block) {
  [...block.children].forEach((card) => {
    if (card.children.length === 2) {
      card.className = 'footer-card';
      const h3 = document.createElement('h3');
      h3.textContent = card.children[0].textContent;
      const ul = card.children[1].cloneNode(true).childNodes;
      card.textContent = '';
      card.append(h3);
      card.append(...ul);
    } else {
      card.remove();
    }
  });
}
