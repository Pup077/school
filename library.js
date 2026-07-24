(() => {
    const page = document.querySelector("[data-library-category]");
    if (!page) return;
    const category = page.dataset.libraryCategory;
    const list = page.querySelector("[data-library-list]");
    const limitSelect = page.querySelector("[data-library-limit]");
    const pagination = page.querySelector("[data-library-pagination]");
    let documents = []; let currentPage = 1;
    const escape = (value="") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
    const render = () => {
        const limit = Number(limitSelect.value || 10); const pages = Math.max(1, Math.ceil(documents.length / limit)); currentPage = Math.min(currentPage, pages);
        const items = documents.slice((currentPage-1)*limit, currentPage*limit);
        list.innerHTML = items.length ? items.map(item => `<tr><td><a href="library-document.php?id=${encodeURIComponent(item.id)}">${escape(item.title)}</a></td><td>${escape(item.author)}</td><td><span class="view-badge">${escape(item.views)}</span></td></tr>`).join("") : `<tr><td colspan="3" class="library-empty">ยังไม่มีเอกสารที่เผยแพร่</td></tr>`;
        pagination.innerHTML = pages > 1 ? `<button ${currentPage===1?'disabled':''} data-page="${currentPage-1}">ก่อนหน้า</button><span>หน้า ${currentPage} / ${pages}</span><button ${currentPage===pages?'disabled':''} data-page="${currentPage+1}">ถัดไป</button>` : "";
    };
    limitSelect.addEventListener("change", () => { currentPage=1; render(); });
    pagination.addEventListener("click", e => { const p=Number(e.target.dataset.page); if(p){currentPage=p;render();} });
    fetch(`public_library.php?category=${encodeURIComponent(category)}`, {cache:"no-store"}).then(r=>r.json()).then(data=>{ if(!data.ok) throw new Error(data.message); documents=data.documents||[]; render(); }).catch(()=>{list.innerHTML='<tr><td colspan="3" class="library-empty">โหลดข้อมูลไม่สำเร็จ</td></tr>';});
})();
