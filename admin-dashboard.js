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

const typeLabels = {
    public: "ข่าวประชาสัมพันธ์",
    job: "ข่าวรับสมัครงาน",
    procurement: "ข่าวจัดซื้อจัดจ้าง"
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
    }, 2200);
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

const renderAdminList = () => {
    const items = getNews();
    list.innerHTML = items.map((item) => `
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

const renderAdminMembers = () => {
    if (!memberList) return;

    const currentAdmin = getCurrentAdmin();
    memberList.innerHTML = getAdminUsers().map((user) => `
        <article class="admin-member-item">
            <div>
                <span>${escapeHtml(user.role === "admin" ? "Admin" : "Editor")} / ${user.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                <h3>${escapeHtml(user.fullName)}</h3>
                <p>ชื่อผู้ใช้: ${escapeHtml(user.username)}</p>
                <small>สร้างเมื่อ ${escapeHtml(formatDateTime(user.createdAt))} | เข้าสู่ระบบล่าสุด ${escapeHtml(formatDateTime(user.lastLoginAt))}</small>
            </div>
            <div class="admin-item-actions">
                <button type="button" data-edit-admin="${escapeHtml(user.id)}">แก้ไข</button>
                <button type="button" data-toggle-admin="${escapeHtml(user.id)}" ${user.username === currentAdmin.username ? "disabled" : ""}>${user.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>
                <button class="danger" type="button" data-delete-admin="${escapeHtml(user.id)}" ${user.username === currentAdmin.username ? "disabled" : ""}>ลบ</button>
            </div>
        </article>
    `).join("");
};

const renderAuditLogs = () => {
    if (!historyList) return;

    const logs = getAuditLogs();
    if (!logs.length) {
        historyList.innerHTML = `<p class="news-empty">ยังไม่มีประวัติการแก้ไข</p>`;
        return;
    }

    historyList.innerHTML = logs.slice(0, 40).map((log) => `
        <article class="admin-history-item">
            <div>
                <span>${escapeHtml(log.action)} / ${escapeHtml(log.targetType)}</span>
                <h3>${escapeHtml(log.targetName)}</h3>
                <p>${escapeHtml(log.detail)}</p>
            </div>
            <small>${escapeHtml(log.actorName)} (${escapeHtml(log.actorUsername)})<br>${escapeHtml(formatDateTime(log.createdAt))}</small>
        </article>
    `).join("");
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
    memberForm.elements.password.value = user.password || "";
    memberForm.elements.password.required = true;
    memberForm.elements.role.value = user.role || "editor";
    memberForm.scrollIntoView({ behavior: "smooth", block: "start" });
};

const getFormValue = (formData, key) => String(formData.get(key) || "").trim();

requireAdmin();
emptyForm();
emptyMemberForm();
renderAdminList();
renderAdminMembers();
renderAuditLogs();

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const id = getFormValue(formData, "id");
    const type = getFormValue(formData, "type") || "public";
    const newsItem = {
        id: id || `${type}-${Date.now()}`,
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

    const items = getNews();
    const index = items.findIndex((item) => item.id === newsItem.id);
    const action = index >= 0 ? "update_news" : "create_news";
    if (index >= 0) {
        items[index] = newsItem;
    } else {
        items.unshift(newsItem);
    }

    saveNews(items);
    saveAuditLog({
        action,
        targetType: "news_item",
        targetName: newsItem.title,
        detail: `${index >= 0 ? "แก้ไข" : "เพิ่ม"}${typeLabels[newsItem.type] || "ข่าว"} สถานะ ${newsItem.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}`
    });
    renderAdminList();
    renderAuditLogs();
    emptyForm();
    setStatus("บันทึกข่าวเรียบร้อยแล้ว");
});

list.addEventListener("click", (event) => {
    const editId = event.target.dataset.editNews;
    const deleteId = event.target.dataset.deleteNews;
    const items = getNews();

    if (editId) {
        const item = items.find((newsItem) => newsItem.id === editId);
        if (item) fillForm(item);
    }

    if (deleteId) {
        const deletedItem = items.find((newsItem) => newsItem.id === deleteId);
        const nextItems = items.filter((newsItem) => newsItem.id !== deleteId);
        saveNews(nextItems);
        saveAuditLog({
            action: "delete_news",
            targetType: "news_item",
            targetName: deletedItem ? deletedItem.title : deleteId,
            detail: "ลบข่าวออกจากระบบ"
        });
        renderAdminList();
        renderAuditLogs();
        emptyForm();
        setStatus("ลบข่าวเรียบร้อยแล้ว");
    }
});

if (memberForm) {
    memberForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(memberForm);
        const id = getFormValue(formData, "id");
        const username = getFormValue(formData, "username");
        const users = getAdminUsers();
        const duplicate = users.some((user) => user.username.toLowerCase() === username.toLowerCase() && user.id !== id);

        if (duplicate) {
            setStatus("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว", memberStatusText);
            return;
        }

        const userData = {
            id: id || `admin-${Date.now()}`,
            username,
            password: getFormValue(formData, "password"),
            fullName: getFormValue(formData, "fullName"),
            role: getFormValue(formData, "role") || "editor",
            status: "active",
            createdAt: new Date().toISOString()
        };
        const index = users.findIndex((user) => user.id === userData.id);

        if (index >= 0) {
            users[index] = { ...users[index], ...userData, createdAt: users[index].createdAt };
        } else {
            users.unshift(userData);
        }

        saveAdminUsers(users);
        saveAuditLog({
            action: index >= 0 ? "update_admin" : "create_admin",
            targetType: "admin_user",
            targetName: userData.username,
            detail: `${index >= 0 ? "แก้ไข" : "เพิ่ม"}สมาชิก Admin ${userData.fullName}`
        });
        renderAdminMembers();
        renderAuditLogs();
        emptyMemberForm();
        setStatus("บันทึกสมาชิกเรียบร้อยแล้ว", memberStatusText);
    });
}

if (memberList) {
    memberList.addEventListener("click", (event) => {
        const editId = event.target.dataset.editAdmin;
        const toggleId = event.target.dataset.toggleAdmin;
        const deleteId = event.target.dataset.deleteAdmin;
        const users = getAdminUsers();
        const currentAdmin = getCurrentAdmin();

        if (editId) {
            const user = users.find((adminUser) => adminUser.id === editId);
            if (user) fillMemberForm(user);
        }

        if (toggleId) {
            const user = users.find((adminUser) => adminUser.id === toggleId);
            if (!user || user.username === currentAdmin.username) return;
            user.status = user.status === "active" ? "inactive" : "active";
            saveAdminUsers(users);
            saveAuditLog({
                action: "toggle_admin_status",
                targetType: "admin_user",
                targetName: user.username,
                detail: `${user.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}สมาชิก Admin ${user.fullName}`
            });
            renderAdminMembers();
            renderAuditLogs();
        }

        if (deleteId) {
            const user = users.find((adminUser) => adminUser.id === deleteId);
            if (!user || user.username === currentAdmin.username) return;
            saveAdminUsers(users.filter((adminUser) => adminUser.id !== deleteId));
            saveAuditLog({
                action: "delete_admin",
                targetType: "admin_user",
                targetName: user.username,
                detail: `ลบสมาชิก Admin ${user.fullName}`
            });
            renderAdminMembers();
            renderAuditLogs();
            emptyMemberForm();
        }
    });
}

document.querySelector("[data-new-news]").addEventListener("click", emptyForm);
document.querySelector("[data-reset-news]").addEventListener("click", emptyForm);
document.querySelector("[data-reset-admin-member]").addEventListener("click", emptyMemberForm);
document.querySelector("[data-clear-audit-log]").addEventListener("click", () => {
    localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify([]));
    renderAuditLogs();
});
document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_USER_KEY);
    window.location.href = "admin_logout.php";
});
