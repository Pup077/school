const requireAdmin = () => {
    if (window.location.pathname.endsWith("admin-dashboard.php")) {
        return;
    }

    if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== "true") {
        window.location.href = "index.html";
    }
};

const form = document.querySelector("[data-news-form]");
const list = document.querySelector("[data-admin-news-list]");
const statusText = document.querySelector("[data-admin-status]");
const memberForm = document.querySelector("[data-admin-member-form]");
const memberList = document.querySelector("[data-admin-member-list]");
const memberStatusText = document.querySelector("[data-admin-member-status]");
const historyList = document.querySelector("[data-admin-history-list]");

let dbNews = [];
let dbMembers = [];
let currentAdminId = "";
let historyPage = 1;

const typeLabels = {
    public: "ข่าวประชาสัมพันธ์",
    job: "ข่าวรับสมัครงาน",
    procurement: "ข่าวจัดซื้อจัดจ้าง"
};

const actionLabels = {
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    create_news: "เพิ่มข่าว",
    update_news: "แก้ไขข่าว",
    delete_news: "ลบข่าว"
};

const apiRequest = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {})
        },
        cache: "no-store",
        ...options
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาด");
    }
    return data;
};

const emptyForm = () => {
    form.reset();
    form.elements.id.value = "";
    form.elements.type.value = "public";
    form.elements.category.value = "ข่าวเด่น";
    form.elements.author.value = "งานประชาสัมพันธ์";
    form.elements.status.value = "published";
    form.elements.displayStatus.value = "เผยแพร่";
    form.elements.image.value = defaultImage;
};

const setStatus = (text, target = statusText) => {
    if (!target) return;
    target.textContent = text;
    window.setTimeout(() => {
        target.textContent = "";
    }, 2600);
};

const adminMetaText = (item) => {
    if (item.type === "procurement") {
        return [item.date, item.announcementNo, item.displayStatus].filter(Boolean).join(" | ");
    }

    if (item.type === "job") {
        return [item.metaOne || item.date, item.metaTwo || item.displayStatus].filter(Boolean).join(" | ");
    }

    return metaText(item);
};

const loadNews = async () => {
    const data = await apiRequest("admin_news.php?action=list");
    dbNews = data.news || [];
};

const renderAdminList = () => {
    if (!dbNews.length) {
        list.innerHTML = `<p class="news-empty">ยังไม่มีข่าวในฐานข้อมูล</p>`;
        return;
    }

    list.innerHTML = dbNews.map((item) => `
        <article class="admin-news-item">
            <img src="${escapeHtml(item.image || defaultImage)}" alt="${escapeHtml(item.title)}">
            <div>
                <span>${escapeHtml(typeLabels[item.type] || typeLabels.public)} / ${escapeHtml(item.category || "-")} / ${item.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
                <small>${escapeHtml(adminMetaText(item))}</small>
                <div class="admin-item-actions">
                    <button type="button" data-edit-news="${escapeHtml(item.id)}">แก้ไข</button>
                    <button class="danger" type="button" data-delete-news="${escapeHtml(item.id)}">ลบ</button>
                </div>
            </div>
        </article>
    `).join("");
};

const loadAdminMembers = async () => {
    const data = await apiRequest("admin_members.php?action=list");
    dbMembers = data.members || [];
    currentAdminId = data.currentAdminId || "";
};

const renderAdminMembers = () => {
    if (!memberList) return;

    if (!dbMembers.length) {
        memberList.innerHTML = `<p class="news-empty">ยังไม่มีสมาชิก Admin ในฐานข้อมูล</p>`;
        return;
    }

    memberList.innerHTML = dbMembers.map((user) => `
        <article class="admin-member-item">
            <div>
                <span>${escapeHtml(user.role === "admin" ? "Admin" : "Editor")} / ${user.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                <h3>${escapeHtml(user.fullName)}</h3>
                <p>ชื่อผู้ใช้: ${escapeHtml(user.username)}</p>
                <small>สร้างเมื่อ ${escapeHtml(formatDateTime(user.createdAt))} | เข้าสู่ระบบล่าสุด ${escapeHtml(formatDateTime(user.lastLoginAt))}</small>
            </div>
            <div class="admin-item-actions">
                <button type="button" data-edit-admin="${escapeHtml(user.id)}">แก้ไข</button>
                <button type="button" data-toggle-admin="${escapeHtml(user.id)}" ${user.id === currentAdminId ? "disabled" : ""}>${user.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>
                <button class="danger" type="button" data-delete-admin="${escapeHtml(user.id)}" ${user.id === currentAdminId ? "disabled" : ""}>ลบ</button>
            </div>
        </article>
    `).join("");
};

const renderHistoryPager = (page, totalPages) => `
    <div class="admin-pagination">
        <button type="button" data-history-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>หน้าก่อน</button>
        <span>หน้า ${escapeHtml(page)} / ${escapeHtml(totalPages)}</span>
        <button type="button" data-history-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>หน้าถัดไป</button>
    </div>
`;

const renderAuditLogs = async (page = historyPage) => {
    if (!historyList) return;

    historyPage = page;
    historyList.innerHTML = `<p class="news-empty">กำลังโหลดประวัติการใช้งาน...</p>`;

    let data;
    try {
        data = await apiRequest(`admin_activity_logs.php?page=${encodeURIComponent(historyPage)}`);
    } catch (error) {
        historyList.innerHTML = `<p class="news-empty">โหลดประวัติการใช้งานไม่สำเร็จ</p>`;
        return;
    }

    const logs = Array.isArray(data.logs) ? data.logs : [];
    if (!logs.length) {
        historyList.innerHTML = `<p class="news-empty">ยังไม่มีประวัติการใช้งาน</p>`;
        return;
    }

    historyList.innerHTML = `
        ${logs.map((log) => `
            <article class="admin-history-item">
                <div>
                    <span>${escapeHtml(actionLabels[log.action] || log.action)} / ${escapeHtml(log.targetType)}</span>
                    <h3>${escapeHtml(log.targetName || log.actorName || "-")}</h3>
                    <p>${escapeHtml(log.detail || "-")} ${log.ipAddress ? `IP: ${escapeHtml(log.ipAddress)}` : ""}</p>
                </div>
                <small>${escapeHtml(log.actorName)} (${escapeHtml(log.actorUsername)})<br>${escapeHtml(formatDateTime(log.createdAt))}</small>
            </article>
        `).join("")}
        ${renderHistoryPager(data.page || 1, data.totalPages || 1)}
    `;
};

const fillForm = (item) => {
    form.elements.id.value = item.id;
    form.elements.type.value = item.type || "public";
    form.elements.title.value = item.title || "";
    form.elements.summary.value = item.summary || "";
    form.elements.category.value = item.category || "";
    form.elements.date.value = item.date || "";
    form.elements.author.value = item.author || "";
    form.elements.status.value = item.status || "published";
    form.elements.announcementNo.value = item.announcementNo || "";
    form.elements.displayStatus.value = item.displayStatus || "";
    form.elements.metaOne.value = item.metaOne || "";
    form.elements.metaTwo.value = item.metaTwo || "";
    form.elements.image.value = item.image || defaultImage;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
};

const emptyMemberForm = () => {
    if (!memberForm) return;
    memberForm.reset();
    memberForm.elements.id.value = "";
    memberForm.elements.role.value = "editor";
    memberForm.elements.password.required = true;
};

const fillMemberForm = (user) => {
    if (!memberForm) return;
    memberForm.elements.id.value = user.id;
    memberForm.elements.fullName.value = user.fullName || "";
    memberForm.elements.username.value = user.username || "";
    memberForm.elements.password.value = "";
    memberForm.elements.password.required = false;
    memberForm.elements.password.placeholder = "เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน";
    memberForm.elements.role.value = user.role || "editor";
    memberForm.scrollIntoView({ behavior: "smooth", block: "start" });
};

const getFormValue = (formData, key) => String(formData.get(key) || "").trim();

const loadDashboard = async () => {
    requireAdmin();
    emptyForm();
    emptyMemberForm();

    try {
        await Promise.all([loadNews(), loadAdminMembers(), renderAuditLogs(1)]);
        renderAdminList();
        renderAdminMembers();
    } catch (error) {
        setStatus(error.message || "โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ");
    }
};

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const type = getFormValue(formData, "type") || "public";
    const newsItem = {
        id: getFormValue(formData, "id"),
        type,
        title: getFormValue(formData, "title"),
        summary: getFormValue(formData, "summary"),
        category: getFormValue(formData, "category") || "ข่าวประชาสัมพันธ์",
        date: getFormValue(formData, "date"),
        author: getFormValue(formData, "author"),
        image: getFormValue(formData, "image") || defaultImage,
        announcementNo: getFormValue(formData, "announcementNo"),
        displayStatus: getFormValue(formData, "displayStatus"),
        metaOne: getFormValue(formData, "metaOne"),
        metaTwo: getFormValue(formData, "metaTwo"),
        status: getFormValue(formData, "status") || "published"
    };

    if (type === "job" && !newsItem.displayStatus) newsItem.displayStatus = newsItem.category || "เปิดรับสมัคร";
    if (type === "procurement" && !newsItem.displayStatus) newsItem.displayStatus = "เผยแพร่";

    try {
        const data = await apiRequest("admin_news.php?action=save", {
            method: "POST",
            body: JSON.stringify(newsItem)
        });
        await loadNews();
        renderAdminList();
        await renderAuditLogs(1);
        emptyForm();
        setStatus(data.message || "บันทึกข่าวเรียบร้อยแล้ว");
    } catch (error) {
        setStatus(error.message || "บันทึกข่าวไม่สำเร็จ");
    }
});

list.addEventListener("click", async (event) => {
    const editId = event.target.dataset.editNews;
    const deleteId = event.target.dataset.deleteNews;

    if (editId) {
        const item = dbNews.find((newsItem) => newsItem.id === editId);
        if (item) fillForm(item);
    }

    if (deleteId) {
        const deletedItem = dbNews.find((newsItem) => newsItem.id === deleteId);
        if (!deletedItem || !window.confirm(`ต้องการลบข่าว "${deletedItem.title}" ใช่หรือไม่`)) return;

        try {
            const data = await apiRequest("admin_news.php?action=delete", {
                method: "POST",
                body: JSON.stringify({ id: deleteId })
            });
            await loadNews();
            renderAdminList();
            await renderAuditLogs(1);
            emptyForm();
            setStatus(data.message || "ลบข่าวเรียบร้อยแล้ว");
        } catch (error) {
            setStatus(error.message || "ลบข่าวไม่สำเร็จ");
        }
    }
});

if (memberForm) {
    memberForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(memberForm);
        const userData = {
            id: getFormValue(formData, "id"),
            username: getFormValue(formData, "username"),
            password: getFormValue(formData, "password"),
            fullName: getFormValue(formData, "fullName"),
            role: getFormValue(formData, "role") || "editor"
        };

        try {
            const data = await apiRequest("admin_members.php?action=save", {
                method: "POST",
                body: JSON.stringify(userData)
            });
            await loadAdminMembers();
            renderAdminMembers();
            await renderAuditLogs(1);
            emptyMemberForm();
            setStatus(data.message || "บันทึกสมาชิกเรียบร้อยแล้ว", memberStatusText);
        } catch (error) {
            setStatus(error.message || "บันทึกสมาชิกไม่สำเร็จ", memberStatusText);
        }
    });
}

if (memberList) {
    memberList.addEventListener("click", async (event) => {
        const editId = event.target.dataset.editAdmin;
        const toggleId = event.target.dataset.toggleAdmin;
        const deleteId = event.target.dataset.deleteAdmin;

        if (editId) {
            const user = dbMembers.find((adminUser) => adminUser.id === editId);
            if (user) fillMemberForm(user);
        }

        if (toggleId) {
            try {
                const data = await apiRequest("admin_members.php?action=toggle", {
                    method: "POST",
                    body: JSON.stringify({ id: toggleId })
                });
                await loadAdminMembers();
                renderAdminMembers();
                await renderAuditLogs(1);
                setStatus(data.message || "อัปเดตสถานะสมาชิกเรียบร้อยแล้ว", memberStatusText);
            } catch (error) {
                setStatus(error.message || "อัปเดตสถานะสมาชิกไม่สำเร็จ", memberStatusText);
            }
        }

        if (deleteId) {
            const user = dbMembers.find((adminUser) => adminUser.id === deleteId);
            if (!user || !window.confirm(`ต้องการลบสมาชิก "${user.username}" ใช่หรือไม่`)) return;

            try {
                const data = await apiRequest("admin_members.php?action=delete", {
                    method: "POST",
                    body: JSON.stringify({ id: deleteId })
                });
                await loadAdminMembers();
                renderAdminMembers();
                await renderAuditLogs(1);
                emptyMemberForm();
                setStatus(data.message || "ลบสมาชิกเรียบร้อยแล้ว", memberStatusText);
            } catch (error) {
                setStatus(error.message || "ลบสมาชิกไม่สำเร็จ", memberStatusText);
            }
        }
    });
}

if (historyList) {
    historyList.addEventListener("click", (event) => {
        const page = Number(event.target.dataset.historyPage || 0);
        if (page > 0) renderAuditLogs(page);
    });
}

document.querySelector("[data-new-news]").addEventListener("click", emptyForm);
document.querySelector("[data-reset-news]").addEventListener("click", emptyForm);
document.querySelector("[data-reset-admin-member]").addEventListener("click", emptyMemberForm);
document.querySelector("[data-clear-audit-log]").addEventListener("click", () => renderAuditLogs(historyPage));
document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_USER_KEY);
    window.location.href = "admin_logout.php";
});

loadDashboard();
