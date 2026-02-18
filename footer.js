function initFooter() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #site-footer {
      margin-top: auto;
      padding: 24px;
      text-align: center;
      color: #666;
      border-top: 1px solid rgba(0,0,0,0.06);
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    #site-footer a {
      color: inherit;
      text-decoration: none;
    }
    #site-footer a:hover {
      text-decoration: underline;
    }
    .footer-nav {
      font-size: 14px;
    }
    .footer-copyright {
      margin: 0;
      font-size: 13px;
    }
    
    .modal {
      position: fixed;
      inset: 0;
      display: none;
      z-index: 2000;
    }
    .modal.is-open {
      display: block;
    }
    .modal__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
    }
    .modal__content {
      position: relative;
      max-width: 640px;
      margin: 10vh auto 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      padding: 16px 18px;
    }
    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .modal__footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }
    .modal__close {
      background: #ef6b6b;
      color: #fff;
      border: none;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .modal__body p {
      margin: 0 0 10px;
      color: #333;
      line-height: 1.6;
    }
    .modal__body p:last-child {
      margin-bottom: 0;
    }
    @media (max-width: 768px) {
      .modal__content {
        margin: 12vh 16px 0;
      }
    }
  `;
  document.head.appendChild(styleEl);

  const footerEl = document.getElementById('site-footer');
  if (!footerEl) return;

  let readmeLink = '<a href="#readme-modal" id="footer-readme-link" aria-haspopup="dialog" aria-controls="readme-modal">ツール利用規約</a> / ';

  footerEl.innerHTML = `
    <nav class="footer-nav">
      ${readmeLink}<a href="https://github.com/syatiyama-san/syatiyama-base/blob/main/LICENSE" id="footer-link" aria-label="ライセンス情報" target="_blank" rel="noopener noreferrer">MIT License</a> / <a href="https://github.com/syatiyama-san/syatiyama-base/releases" target="_blank" rel="noopener noreferrer">Release note</a>
    </nav>
    <p class="footer-copyright">@2026 syatiyama-san</p>
  `;

  let modal = document.getElementById('readme-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'readme-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'readme-modal-title');
    modal.setAttribute('aria-hidden', 'true');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal__backdrop" data-close="true"></div>
      <div class="modal__content" role="document">
        <div class="modal__header">
          <h3 id="readme-modal-title">ツール利用規約</h3>
        </div>
        <div class="modal__body">
          <p>・本サイト/ツールはAIコーディングで生成されています。</p>
          <p>・自分用に製作したものですが、誰でも無料で自由に使ってよいフリーツールとして公開しています。</p>
          <p>・利用は自己責任でお願いします。製作者が何か責任を負ったりすることは一切ありません。</p>
          <br>
          <p>・アップロードしたデータはエクスポートのみに使用されます。外部へ送信されることはありません。</p>
          <p>・開発/動作確認の環境はWindows版Chromeです。環境によっては動作しないかも。動作は保証しません。</p>
          <p>・バグなど何かありましたら<a href="https://forms.gle/j2HgKUx7Bi8Br3zXA" target="_blank" rel="noopener noreferrer">ここ</a>からご連絡ください。お返事、バグ修正、アプデなどは気が向いたらやります。</p>
          <br>
          <p>・MIT Licenseの元で提供されていますが、一部ライブラリには別のライセンスが適用されているものがあります。改変、再頒布の際はそれぞれのライセンスをご確認ください。</p>
        </div>
        <div class="modal__footer">
          <button type="button" class="modal__close" aria-label="閉じる" data-close="true">OK！</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const readmeLink_el = document.getElementById('footer-readme-link');
  if (readmeLink_el && modal) {
    readmeLink_el.addEventListener('click', (event) => {
      event.preventDefault();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  }

  if (modal) {
    const closeTargets = modal.querySelectorAll('[data-close="true"]');
    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    closeTargets.forEach((el) => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initFooter);
