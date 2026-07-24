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
const calendarForm = document.querySelector("[data-calendar-form]");
const calendarList = document.querySelector("[data-calendar-list]");
const calendarStatus = document.querySelector("[data-calendar-status]");
const libraryForm = document.querySelector("[data-library-form]");
const libraryList = document.querySelector("[data-library-admin-list]");
const libraryStatus = document.querySelector("[data-library-status]");
const examForm = document.querySelector("[data-exam-form]");
const examList = document.querySelector("[data-exam-admin-list]");
const examStatus = document.querySelector("[data-exam-status]");
const registrationForm = document.querySelector("[data-registration-form]");
const registrationList = document.querySelector("[data-registration-list]");
const registrationStatus = document.querySelector("[data-registration-status]");
const siteNoticeForm = document.querySelector("[data-site-notice-form]");
const siteNoticeStatus = document.querySelector("[data-site-notice-status]");

let dbNews = [];
let dbMembers = [];
let dbCalendarEvents = [];
let dbLibraryDocuments = [];
let dbExamPosts = [];
let dbRegistrationPlans = [];
let currentAdminId = "";
let currentAdminName = "";
let currentAdminRole = "editor";
let historyPage = 1;
let newsPage = 1;
let memberPage = 1;

const NEWS_PER_PAGE = 7;
const MEMBERS_PER_PAGE = 4;

const typeLabels = {
    public: "ข่าวประชาสัมพันธ์",
    job: "ข่าวรับสมัครงาน",
    procurement: "ข่าวจัดซื้อจัดจ้าง"
};

const newsTypeConfig = {
    public: {
        showCategory: true,
        categoryOptions: ["ข่าวเด่น", "ข่าวประชาสัมพันธ์"],
        showDisplayStatus: false,
        mediaMode: "image",
        defaultCategory: "ข่าวเด่น",
        defaultDisplayStatus: ""
    },
    job: {
        showCategory: true,
        categoryOptions: ["สมัครงาน", "สมัครเรียน"],
        showDisplayStatus: true,
        displayStatusOptions: ["กำลังรับสมัคร", "ปิดรับสมัคร"],
        mediaMode: "document",
        defaultCategory: "สมัครงาน",
        defaultDisplayStatus: "กำลังรับสมัคร"
    },
    procurement: {
        showCategory: false,
        categoryOptions: [],
        showDisplayStatus: true,
        displayStatusOptions: ["อยู่ระหว่างจัดซื้อ", "จัดซื้อเสร็จสิ้น"],
        mediaMode: "document",
        defaultCategory: "",
        defaultDisplayStatus: "อยู่ระหว่างจัดซื้อ"
    }
};

const actionLabels = {
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    create_news: "เพิ่มข่าว",
    update_news: "แก้ไขข่าว",
    delete_news: "ลบข่าว"
    ,create_calendar: "เพิ่มกิจกรรมปฏิทิน", update_calendar: "แก้ไขกิจกรรมปฏิทิน", delete_calendar: "ลบกิจกรรมปฏิทิน"
    ,create_library: "เพิ่มหลักสูตร/แบบฟอร์ม", update_library: "แก้ไขหลักสูตร/แบบฟอร์ม", delete_library: "ลบหลักสูตร/แบบฟอร์ม"
    ,create_exam: "เพิ่มตารางการทดสอบ", update_exam: "แก้ไขตารางการทดสอบ", delete_exam: "ลบตารางการทดสอบ"
    ,create_registration: "เพิ่มแผนลงทะเบียน", update_registration: "แก้ไขแผนลงทะเบียน", delete_registration: "ลบแผนลงทะเบียน"
    ,create_admin: "เพิ่มสมาชิก Admin", update_admin: "แก้ไขสมาชิก Admin", delete_admin: "ลบสมาชิก Admin"
    ,update_site_notice: "แก้ไขประกาศหน้าแรก"
};

const targetTypeLabels = {
    news_item: "ข่าว",
    admin_user: "สมาชิก Admin",
    calendar_event: "ปฏิทินการศึกษา",
    library_document: "หลักสูตร/แบบฟอร์ม",
    exam_post: "ตารางการทดสอบ",
    registration_plan: "แผนการลงทะเบียน",
    site_setting: "ตั้งค่าเว็บไซต์"
};

const thaiMonthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม"
];

const thaiMonthLookup = thaiMonthNames.reduce((map, month, index) => {
    map[month] = index + 1;
    return map;
}, {
    "ม.ค.": 1,
    "ก.พ.": 2,
    "มี.ค.": 3,
    "เม.ย.": 4,
    "พ.ค.": 5,
    "มิ.ย.": 6,
    "ก.ค.": 7,
    "ส.ค.": 8,
    "ก.ย.": 9,
    "ต.ค.": 10,
    "พ.ย.": 11,
    "ธ.ค.": 12
});

const todayIsoDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const apiRequest = async (url, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {})
        },
        cache: "no-store",
        ...options
    });
    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (error) {
        throw new Error("เซิร์ฟเวอร์ประมวลผลไม่สำเร็จ กรุณาตรวจสอบ PHP error log");
    }
    if (!response.ok || !data.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาด");
    }
    return data;
};

const emptyForm = () => {
    form.reset();
    form.elements.id.value = "";
    form.elements.type.value = "public";
    form.elements.author.value = currentAdminName;
    form.elements.status.value = "published";
    form.elements.announcementNo.value = "";
    form.elements.date.value = todayIsoDate();
    form.elements.image.value = "";
    if (form.elements.imageFile) form.elements.imageFile.value = "";
    if (form.elements.contentImages) form.elements.contentImages.value = "";
    if (form.elements.documentFile) form.elements.documentFile.value = "";
    if (form.elements.document) form.elements.document.value = "";
    if (form.elements.documentName) form.elements.documentName.value = "";
    renderCurrentDocumentControls([]);
    renderCurrentImageControls([]);
    configureNewsTypeFields("public");
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
        return [item.date, item.displayStatus].filter(Boolean).join(" | ");
    }

    if (item.type === "job") {
        return [item.metaOne || item.date, item.metaTwo || item.displayStatus].filter(Boolean).join(" | ");
    }

    return metaText(item);
};

const setSelectOptions = (select, options, selectedValue = "") => {
    select.innerHTML = options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
    if (options.includes(selectedValue)) {
        select.value = selectedValue;
        return;
    }
    select.value = options[0] || "";
};

const toggleFormField = (field, visible) => {
    if (!field) return;
    field.hidden = !visible;
    field.querySelectorAll("input, select, textarea").forEach((element) => {
        element.disabled = !visible;
    });
};

const renderPager = (page, totalPages, dataName) => `
    <div class="admin-pagination">
        <button type="button" data-${dataName}-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>หน้าก่อน</button>
        <span>หน้า ${escapeHtml(page)} / ${escapeHtml(totalPages)}</span>
        <button type="button" data-${dataName}-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>หน้าถัดไป</button>
    </div>
`;

const documentNameFromUrl = (url = "") => {
    const text = String(url || "").trim();
    if (!text) return "";

    try {
        const path = new URL(text, window.location.href).pathname;
        return decodeURIComponent(path.split("/").filter(Boolean).pop() || "");
    } catch (error) {
        return decodeURIComponent(text.split(/[\\/]/).filter(Boolean).pop() || text);
    }
};

const adminDocumentsForItem = (item) => {
    if (Array.isArray(item.documents) && item.documents.length) {
        return item.documents;
    }

    if (item.documentUrl) {
        return [{
            id: item.id,
            url: item.documentUrl,
            name: item.documentName || documentNameFromUrl(item.documentUrl)
        }];
    }

    return [];
};

const renderCurrentDocumentControls = (documents = []) => {
    const box = form.querySelector("[data-current-document-list]");
    if (!box) return;

    if (!documents.length) {
        box.innerHTML = `<p class="admin-empty-inline">ยังไม่มีไฟล์แนบในข่าวนี้</p>`;
        return;
    }

    box.innerHTML = documents.map((document) => {
        const name = document.name || documentNameFromUrl(document.url) || "เอกสารแนบ";
        return `
            <label class="admin-document-row">
                <input type="checkbox" name="keepDocumentIds[]" value="${escapeHtml(document.id)}" checked>
                <span>${escapeHtml(name)}</span>
            </label>
        `;
    }).join("");
};

const renderCurrentImageControls = (images = []) => {
    const box = form.querySelector("[data-current-image-list]");
    const manager = form.querySelector("[data-content-image-manager]");
    if (!box || !manager) return;
    if (!images.length) {
        box.innerHTML = "";
        toggleFormField(manager, false);
        return;
    }
    box.innerHTML = images.map((image, index) => `
        <label class="admin-image-row">
            <input type="checkbox" name="keepImageIds[]" value="${escapeHtml(image.id)}" checked>
            <img src="${escapeHtml(image.url)}" alt="รูปประกอบ ${index + 1}">
            <span>เก็บรูปที่ ${index + 1}</span>
        </label>
    `).join("");
    toggleFormField(manager, true);
};

const configureNewsTypeFields = (type = "public", values = {}) => {
    const config = newsTypeConfig[type] || newsTypeConfig.public;
    const categoryField = form.querySelector("[data-category-field]");
    const displayStatusField = form.querySelector("[data-display-status-field]");
    const imageLinkField = form.querySelector("[data-image-link-field]");
    const imageFileField = form.querySelector("[data-image-file-field]");
    const contentImageField = form.querySelector("[data-content-image-field]");
    const contentImageManager = form.querySelector("[data-content-image-manager]");
    const documentLinkField = form.querySelector("[data-document-link-field]");
    const documentFileField = form.querySelector("[data-document-file-field]");
    const documentManager = form.querySelector("[data-document-manager]");
    const uploadHelp = form.querySelector("[data-upload-help]");
    const isImageMode = config.mediaMode === "image";

    toggleFormField(categoryField, config.showCategory);
    toggleFormField(displayStatusField, config.showDisplayStatus);
    toggleFormField(imageLinkField, isImageMode);
    toggleFormField(imageFileField, isImageMode);
    toggleFormField(contentImageField, isImageMode);
    if (!isImageMode) toggleFormField(contentImageManager, false);
    else if (contentImageManager) contentImageManager.hidden = !contentImageManager.querySelector("input[name='keepImageIds[]']");
    toggleFormField(documentLinkField, !isImageMode);
    toggleFormField(documentFileField, !isImageMode);
    toggleFormField(documentManager, !isImageMode);
    if (uploadHelp) {
        uploadHelp.textContent = isImageMode
            ? "ถ้าอัปโหลดไฟล์ใหม่ ระบบจะใช้รูปที่อัปโหลดแทนลิงก์รูปภาพ"
            : "ถ้าอัปโหลดไฟล์ใหม่ ระบบจะใช้เอกสารที่อัปโหลดแทนลิงก์เอกสาร";
    }

    if (config.showCategory) {
        setSelectOptions(form.elements.category, config.categoryOptions, values.category || config.defaultCategory);
    } else {
        form.elements.category.disabled = true;
        form.elements.category.innerHTML = "";
    }

    if (config.showDisplayStatus) {
        setSelectOptions(form.elements.displayStatus, config.displayStatusOptions, values.displayStatus || config.defaultDisplayStatus);
    } else {
        form.elements.displayStatus.disabled = true;
        form.elements.displayStatus.innerHTML = "";
    }

    form.elements.announcementNo.value = "";
};

const adminCategoryValue = (type = "public", category = "") => {
    const config = newsTypeConfig[type] || newsTypeConfig.public;
    if (!config.showCategory) return "";
    return config.categoryOptions.includes(category) ? category : config.defaultCategory;
};

const adminDisplayStatusValue = (type = "public", displayStatus = "") => {
    const config = newsTypeConfig[type] || newsTypeConfig.public;
    if (!config.showDisplayStatus) return "";
    return config.displayStatusOptions.includes(displayStatus) ? displayStatus : config.defaultDisplayStatus;
};

const isoDateToThaiDisplay = (isoDate = "") => {
    const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return "";

    const year = Number(match[1]) + 543;
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    return `${day} ${thaiMonthNames[monthIndex]} ${year}`;
};

const thaiDisplayToIsoDate = (displayDate = "") => {
    const text = String(displayDate || "").trim();
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return text;
    const isoDateTimeMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (isoDateTimeMatch) return `${isoDateTimeMatch[1]}-${isoDateTimeMatch[2]}-${isoDateTimeMatch[3]}`;

    const thaiMatch = text.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{4})/);
    if (!thaiMatch) return "";

    const day = String(Number(thaiMatch[1])).padStart(2, "0");
    const month = String(thaiMonthLookup[thaiMatch[2]] || 0).padStart(2, "0");
    const yearNumber = Number(thaiMatch[3]);
    const year = yearNumber > 2400 ? yearNumber - 543 : yearNumber;
    return month !== "00" ? `${year}-${month}-${day}` : "";
};

const loadNews = async () => {
    const data = await apiRequest("admin_news.php?action=list");
    dbNews = data.news || [];
    currentAdminName = data.currentAdmin?.fullName || data.currentAdmin?.username || currentAdminName;
    if (form?.elements?.author) form.elements.author.value = currentAdminName;
};

const renderAdminList = () => {
    if (!dbNews.length) {
        list.innerHTML = `<p class="news-empty">ยังไม่มีข่าวในฐานข้อมูล</p>`;
        return;
    }

    const totalPages = Math.max(1, Math.ceil(dbNews.length / NEWS_PER_PAGE));
    newsPage = Math.min(Math.max(newsPage, 1), totalPages);
    const pageItems = dbNews.slice((newsPage - 1) * NEWS_PER_PAGE, newsPage * NEWS_PER_PAGE);

    list.innerHTML = pageItems.map((item) => {
        const categoryText = item.category ? ` / ${escapeHtml(item.category)}` : "";
        const documents = adminDocumentsForItem(item);
        const documentLabel = documents.length
            ? documents.map((document) => document.name || documentNameFromUrl(document.url)).filter(Boolean).slice(0, 3).join(", ")
            : "PDF / Word";
        const documentCount = documents.length > 1 ? ` (${documents.length} ไฟล์)` : "";
        const mediaHtml = item.type === "public"
            ? (item.image
                ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">`
                : `<div class="admin-news-file"><strong>ยังไม่มีรูปภาพ</strong><span>เพิ่มรูปได้จากปุ่มแก้ไข</span></div>`)
            : `<div class="admin-news-file"><strong>${escapeHtml(documents.length ? `เอกสารแนบ${documentCount}` : "ยังไม่มีเอกสาร")}</strong><span>${escapeHtml(documents.length ? documentLabel : "PDF / Word")}</span></div>`;
        return `
            <article class="admin-news-item">
                ${mediaHtml}
                <div>
                    <span>${escapeHtml(typeLabels[item.type] || typeLabels.public)}${categoryText} / ${item.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.summary)}</p>
                    <small>${escapeHtml(adminMetaText(item))}</small>
                    <div class="admin-item-actions">
                        <button type="button" data-edit-news="${escapeHtml(item.id)}">แก้ไข</button>
                        <button class="danger" type="button" data-delete-news="${escapeHtml(item.id)}">ลบ</button>
                    </div>
                </div>
            </article>
        `;
    }).join("") + (totalPages > 1 ? renderPager(newsPage, totalPages, "news") : "");
};

const loadAdminMembers = async () => {
    const data = await apiRequest("admin_members.php?action=list");
    dbMembers = data.members || [];
    currentAdminId = data.currentAdminId || "";
    currentAdminRole = data.currentAdminRole || "editor";
    if (memberForm?.elements?.role) {
        const adminOption = Array.from(memberForm.elements.role.options).find((option) => option.value === "admin");
        if (adminOption) adminOption.disabled = currentAdminRole !== "admin";
    }
};

const renderAdminMembers = () => {
    if (!memberList) return;

    if (!dbMembers.length) {
        memberList.innerHTML = `<p class="news-empty">ยังไม่มีสมาชิก Admin ในฐานข้อมูล</p>`;
        return;
    }

    const totalPages = Math.max(1, Math.ceil(dbMembers.length / MEMBERS_PER_PAGE));
    memberPage = Math.min(Math.max(memberPage, 1), totalPages);
    const pageItems = dbMembers.slice((memberPage - 1) * MEMBERS_PER_PAGE, memberPage * MEMBERS_PER_PAGE);

    memberList.innerHTML = pageItems.map((user) => {
        const protectedAdmin = currentAdminRole !== "admin" && user.role === "admin";
        const selfAccount = user.id === currentAdminId;
        const disabledTitle = protectedAdmin ? ' title="Editor ไม่สามารถจัดการบัญชี Admin ได้"' : "";
        return `
            <article class="admin-member-item">
                <div>
                    <span>${escapeHtml(user.role === "admin" ? "Admin" : "Editor")} / ${user.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                    <h3>${escapeHtml(user.fullName)}</h3>
                    <p>ชื่อผู้ใช้: ${escapeHtml(user.username)}</p>
                    <small>สร้างเมื่อ ${escapeHtml(formatDateTime(user.createdAt))} | เข้าสู่ระบบล่าสุด ${escapeHtml(formatDateTime(user.lastLoginAt))}</small>
                </div>
                <div class="admin-item-actions">
                    <button type="button" data-edit-admin="${escapeHtml(user.id)}" ${protectedAdmin ? "disabled" : ""}${disabledTitle}>แก้ไข</button>
                    <button type="button" data-toggle-admin="${escapeHtml(user.id)}" ${selfAccount || protectedAdmin ? "disabled" : ""}${disabledTitle}>${user.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>
                    <button class="danger" type="button" data-delete-admin="${escapeHtml(user.id)}" ${selfAccount || protectedAdmin ? "disabled" : ""}${disabledTitle}>ลบ</button>
                </div>
            </article>
        `;
    }).join("") + (totalPages > 1 ? renderPager(memberPage, totalPages, "member") : "");
};

const renderHistoryPager = (page, totalPages) => `
    ${renderPager(page, totalPages, "history")}
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
                    <span>${escapeHtml(actionLabels[log.action] || log.action)} / ${escapeHtml(targetTypeLabels[log.targetType] || log.targetType)}</span>
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
    configureNewsTypeFields(form.elements.type.value, {
        category: adminCategoryValue(form.elements.type.value, item.category),
        displayStatus: adminDisplayStatusValue(form.elements.type.value, item.displayStatus)
    });
    form.elements.title.value = item.title || "";
    form.elements.summary.value = item.summary || "";
    form.elements.content.value = item.content || "";
    form.elements.date.value = item.publishDate || thaiDisplayToIsoDate(item.date) || todayIsoDate();
    form.elements.author.value = currentAdminName || item.author || "";
    form.elements.status.value = item.status || "published";
    form.elements.announcementNo.value = "";
    form.elements.metaOne.value = item.metaOne || "";
    form.elements.metaTwo.value = item.metaTwo || "";
    form.elements.image.value = item.image || "";
    const documents = adminDocumentsForItem(item);
    const firstDocument = documents[0] || {};
    if (form.elements.imageFile) form.elements.imageFile.value = "";
    if (form.elements.contentImages) form.elements.contentImages.value = "";
    if (form.elements.document) form.elements.document.value = firstDocument.url || "";
    if (form.elements.documentName) form.elements.documentName.value = firstDocument.name || documentNameFromUrl(firstDocument.url);
    if (form.elements.documentFile) form.elements.documentFile.value = "";
    renderCurrentDocumentControls(documents);
    renderCurrentImageControls(Array.isArray(item.contentImages) ? item.contentImages : []);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
};

const emptyMemberForm = () => {
    if (!memberForm) return;
    memberForm.reset();
    memberForm.elements.id.value = "";
    memberForm.elements.role.value = "editor";
    const adminOption = Array.from(memberForm.elements.role.options).find((option) => option.value === "admin");
    if (adminOption) adminOption.disabled = currentAdminRole !== "admin";
    memberForm.elements.password.required = true;
};

const fillMemberForm = (user) => {
    if (!memberForm) return;
    if (currentAdminRole !== "admin" && user.role === "admin") return;
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

const emptyCalendarForm = () => {
    if (!calendarForm) return;
    calendarForm.reset();
    calendarForm.elements.id.value = "";
    calendarForm.elements.date.value = todayIsoDate();
    calendarForm.elements.type.value = "school";
    calendarForm.elements.status.value = "published";
};

const loadCalendarEvents = async () => {
    const data = await apiRequest("admin_calendar.php?action=list");
    dbCalendarEvents = Array.isArray(data.events) ? data.events : [];
};

const renderCalendarEvents = () => {
    if (!calendarList) return;
    const typeLabels = { school: "กิจกรรมโรงเรียน", holiday: "วันหยุด", important: "วันสำคัญ" };
    calendarList.innerHTML = dbCalendarEvents.length ? dbCalendarEvents.map((item) => `
        <article class="admin-news-item">
            <div>
                <span>${escapeHtml(item.date)} · ${escapeHtml(typeLabels[item.type] || item.type)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description || "ไม่มีรายละเอียด")}</p>
                <small>${item.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</small>
            </div>
            <div class="admin-item-actions">
                <button type="button" data-edit-calendar="${escapeHtml(item.id)}">แก้ไข</button>
                <button class="danger" type="button" data-delete-calendar="${escapeHtml(item.id)}">ลบ</button>
            </div>
        </article>`).join("") : `<p class="news-empty">ยังไม่มีกิจกรรมที่แอดมินเพิ่ม</p>`;
};

const fillCalendarForm = (item) => {
    if (!calendarForm) return;
    calendarForm.elements.id.value = item.id;
    calendarForm.elements.title.value = item.title || "";
    calendarForm.elements.description.value = item.description || "";
    calendarForm.elements.date.value = item.date || todayIsoDate();
    calendarForm.elements.type.value = item.type || "school";
    calendarForm.elements.status.value = item.status || "published";
    calendarForm.scrollIntoView({ behavior: "smooth", block: "start" });
};

const emptyLibraryForm = () => {
    if (!libraryForm) return;
    libraryForm.reset(); libraryForm.elements.id.value=""; libraryForm.elements.status.value="published";
    libraryForm.elements.author.value=currentAdminName;
    libraryForm.querySelector("[data-library-current-file]").innerHTML="การเพิ่มรายการใหม่จำเป็นต้องเลือกไฟล์ PDF";
};
const loadLibraryDocuments = async () => { const data=await apiRequest("admin_library.php?action=list"); dbLibraryDocuments=data.documents||[]; };
const renderLibraryDocuments = () => {
    if (!libraryList) return;
    const labels={curriculum:"หลักสูตร/คู่มือ",student_form:"แบบฟอร์มนักศึกษา"};
    libraryList.innerHTML=dbLibraryDocuments.length?dbLibraryDocuments.map(item=>`<article class="admin-news-item"><div><span>${escapeHtml(labels[item.category])} · อ่าน ${escapeHtml(item.views)} ครั้ง</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.originalName||"PDF")}</p><small>${item.status==="published"?"เผยแพร่":"ฉบับร่าง"}</small></div><div class="admin-item-actions"><button type="button" data-edit-library="${escapeHtml(item.id)}">แก้ไข</button><button class="danger" type="button" data-delete-library="${escapeHtml(item.id)}">ลบ</button></div></article>`).join(""):`<p class="news-empty">ยังไม่มีเอกสาร</p>`;
};
const fillLibraryForm = item => {
    if(!item)return; libraryForm.elements.id.value=item.id; libraryForm.elements.category.value=item.category; libraryForm.elements.title.value=item.title; libraryForm.elements.description.value=item.description||""; libraryForm.elements.author.value=currentAdminName; libraryForm.elements.status.value=item.status; libraryForm.elements.pdfFile.value=""; libraryForm.querySelector("[data-library-current-file]").innerHTML=`<span class="current-file-label">ไฟล์ PDF ปัจจุบัน</span><strong>${escapeHtml(item.originalName||"PDF")}</strong><a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener">เปิดดูไฟล์เดิม</a><small>หากไม่เลือกไฟล์ใหม่ ระบบจะใช้ไฟล์นี้ต่อไป</small>`; libraryForm.scrollIntoView({behavior:"smooth",block:"start"});
};
const emptyExamForm=()=>{if(!examForm)return;examForm.reset();examForm.elements.id.value="";examForm.elements.status.value="published";examForm.querySelector('[data-exam-current-images]').innerHTML="";toggleFormField(examForm.querySelector('[data-exam-image-manager]'),false);const cover=examForm.querySelector('[data-exam-cover-current]');cover.innerHTML='';cover.hidden=true;};
const loadExamPosts=async()=>{const d=await apiRequest('admin_exams.php?action=list');dbExamPosts=d.posts||[];};
const renderExamPosts=()=>{if(!examList)return;const labels={final:'ปลายภาคเรียน',nnet:'N-NET'};examList.innerHTML=dbExamPosts.length?dbExamPosts.map(x=>`<article class="admin-news-item"><div><span>${labels[x.type]} · ${x.images.length} รูป</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.summary)}</p><small>${x.status==='published'?'เผยแพร่':'ฉบับร่าง'}</small></div><div class="admin-item-actions"><button data-edit-exam="${x.id}">แก้ไข</button><button class="danger" data-delete-exam="${x.id}">ลบ</button></div></article>`).join(''):'<p class="news-empty">ยังไม่มีข้อมูลตารางสอบ</p>';};
const fillExamForm=x=>{if(!x)return;examForm.elements.id.value=x.id;examForm.elements.type.value=x.type;examForm.elements.title.value=x.title;examForm.elements.summary.value=x.summary;examForm.elements.content.value=x.content||'';examForm.elements.status.value=x.status;examForm.elements.coverImage.value='';examForm.elements.contentImages.value='';const cover=examForm.querySelector('[data-exam-cover-current]');cover.innerHTML=x.coverImage?`<span class="current-file-label">ภาพหน้าปกปัจจุบัน</span><img src="${escapeHtml(x.coverImage)}?v=${Date.now()}" alt="ภาพหน้าปกเดิม"><a href="${escapeHtml(x.coverImage)}" target="_blank" rel="noopener">เปิดดูภาพขนาดเต็ม</a><small>หากไม่เลือกภาพใหม่ ระบบจะใช้ภาพนี้ต่อไป</small>`:'<span>ยังไม่มีภาพหน้าปก</span>';cover.hidden=false;const images=Array.isArray(x.images)?x.images:[];const box=examForm.querySelector('[data-exam-current-images]');box.innerHTML=images.length?images.map((img,i)=>`<label class="admin-image-row"><input type="checkbox" name="keepImageIds[]" value="${escapeHtml(img.id)}" checked><img src="${escapeHtml(img.url)}?v=${Date.now()}" alt="รูปที่ ${i+1}"><span>เก็บรูปที่ ${i+1}</span><a href="${escapeHtml(img.url)}" target="_blank" rel="noopener">เปิดดูรูปเดิม</a></label>`).join(''):'<p class="admin-empty-inline">ยังไม่มีรูปตารางในเนื้อหา</p>';const manager=examForm.querySelector('[data-exam-image-manager]');toggleFormField(manager,true);manager.hidden=false;box.style.display='grid';examForm.scrollIntoView({behavior:'smooth',block:'start'});};
const emptyRegistrationForm=()=>{if(!registrationForm)return;registrationForm.reset();registrationForm.elements.id.value='';registrationForm.elements.status.value='published';registrationForm.querySelectorAll('[data-registration-current]').forEach(x=>{x.hidden=true;x.innerHTML='';});};
const loadRegistrationPlans=async()=>{const d=await apiRequest('admin_registration.php?action=list');dbRegistrationPlans=d.plans||[];};
const renderRegistrationPlans=()=>{if(!registrationList)return;registrationList.innerHTML=dbRegistrationPlans.length?dbRegistrationPlans.map(x=>`<article class="admin-news-item"><div><span>PDF ${Object.values(x.files).filter(f=>f.url).length}/3 ไฟล์</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.description||'')}</p><small>${x.status==='published'?'เผยแพร่':'ฉบับร่าง'}</small></div><div class="admin-item-actions"><button data-edit-registration="${x.id}">แก้ไข</button><button class="danger" data-delete-registration="${x.id}">ลบ</button></div></article>`).join(''):'<p class="news-empty">ยังไม่มีแผนการลงทะเบียน</p>';};
const fillRegistrationForm=x=>{if(!x)return;registrationForm.elements.id.value=x.id;registrationForm.elements.title.value=x.title;registrationForm.elements.description.value=x.description||'';registrationForm.elements.status.value=x.status;['primary','lower','upper'].forEach(level=>{const box=registrationForm.querySelector(`[data-registration-current="${level}"]`),file=x.files[level];box.hidden=false;box.innerHTML=file?.url?`<span class="current-file-label">ไฟล์ปัจจุบัน</span><strong>${escapeHtml(file.name||'PDF')}</strong><a href="${escapeHtml(file.url)}" target="_blank" rel="noopener">เปิดดูไฟล์เดิม</a><small>หากไม่เลือกไฟล์ใหม่ ระบบจะใช้ไฟล์นี้ต่อไป</small>`:'<span>ยังไม่มีไฟล์ระดับนี้</span>';});registrationForm.scrollIntoView({behavior:'smooth',block:'start'});};
const loadSiteNoticeSettings = async () => {
    if (!siteNoticeForm) return;
    const data = await apiRequest("admin_site_settings.php?action=get");
    siteNoticeForm.elements.noticeText.value = data.settings?.noticeText || "";
};

const loadDashboard = async () => {
    requireAdmin();
    emptyForm();
    emptyMemberForm();
    emptyCalendarForm();
    emptyLibraryForm();
    emptyExamForm();
    emptyRegistrationForm();

    try {
        await loadNews();
        renderAdminList();
        if (libraryForm) libraryForm.elements.author.value = currentAdminName;
    } catch (error) {
        if (list) list.innerHTML = `<p class="news-empty">โหลดข่าวจากฐานข้อมูลไม่สำเร็จ: ${escapeHtml(error.message || "Database error")}</p>`;
        setStatus(error.message || "โหลดข่าวจากฐานข้อมูลไม่สำเร็จ");
    }

    try {
        await loadAdminMembers();
        renderAdminMembers();
    } catch (error) {
        if (memberList) memberList.innerHTML = `<p class="news-empty">โหลดสมาชิก Admin ไม่สำเร็จ: ${escapeHtml(error.message || "Database error")}</p>`;
        setStatus(error.message || "โหลดสมาชิก Admin ไม่สำเร็จ", memberStatusText);
    }

    try {
        await loadCalendarEvents();
        renderCalendarEvents();
    } catch (error) {
        if (calendarList) calendarList.innerHTML = `<p class="news-empty">โหลดปฏิทินไม่สำเร็จ: ${escapeHtml(error.message)}</p>`;
    }

    try { await loadLibraryDocuments(); renderLibraryDocuments(); } catch(error) { if(libraryList) libraryList.innerHTML=`<p class="news-empty">โหลดคลังเอกสารไม่สำเร็จ: ${escapeHtml(error.message)}</p>`; }
    try { await loadExamPosts(); renderExamPosts(); } catch(error) { if(examList) examList.innerHTML=`<p class="news-empty">โหลดตารางสอบไม่สำเร็จ</p>`; }
    try { await loadRegistrationPlans(); renderRegistrationPlans(); } catch(error) { if(registrationList) registrationList.innerHTML='<p class="news-empty">โหลดแผนการลงทะเบียนไม่สำเร็จ</p>'; }
    try { await loadSiteNoticeSettings(); } catch(error) { setStatus(error.message || "โหลดประกาศหน้าแรกไม่สำเร็จ", siteNoticeStatus); }

    await renderAuditLogs(1);
};

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const type = getFormValue(formData, "type") || "public";
    const selectedDate = getFormValue(formData, "date");
    if (selectedDate) {
        formData.set("publishDate", selectedDate);
        formData.set("date", isoDateToThaiDisplay(selectedDate));
    }
    if (type !== "public") {
        formData.set("image", "");
    }
    formData.set("author", currentAdminName);
    formData.set("announcementNo", "");
    if (type === "public") {
        formData.set("displayStatus", "");
        formData.set("document", "");
        formData.set("documentName", "");
    }
    if (type !== "public" && !getFormValue(formData, "documentName")) {
        formData.set("documentName", documentNameFromUrl(getFormValue(formData, "document")));
    }
    if (type === "procurement") {
        formData.set("category", "");
    }
    if (type === "job" && !getFormValue(formData, "displayStatus")) formData.set("displayStatus", "กำลังรับสมัคร");
    if (type === "procurement" && !getFormValue(formData, "displayStatus")) formData.set("displayStatus", "อยู่ระหว่างจัดซื้อ");

    try {
        const data = await apiRequest("admin_news.php?action=save", {
            method: "POST",
            body: formData
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
        if (currentAdminRole !== "admin" && userData.role === "admin") {
            setStatus("สิทธิ์ Editor ไม่สามารถกำหนดบัญชีระดับ Admin ได้", memberStatusText);
            return;
        }

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

if (calendarForm) {
    calendarForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const body = Object.fromEntries(new FormData(calendarForm).entries());
        try {
            const data = await apiRequest("admin_calendar.php?action=save", { method: "POST", body: JSON.stringify(body) });
            await loadCalendarEvents();
            renderCalendarEvents();
            emptyCalendarForm();
            setStatus(data.message, calendarStatus);
            await renderAuditLogs(1);
        } catch (error) {
            setStatus(error.message || "บันทึกกิจกรรมไม่สำเร็จ", calendarStatus);
        }
    });
}

if (libraryForm) libraryForm.addEventListener("submit", async event => {
    event.preventDefault();
    try { const data=await apiRequest("admin_library.php?action=save",{method:"POST",body:new FormData(libraryForm)}); await loadLibraryDocuments(); renderLibraryDocuments(); emptyLibraryForm(); setStatus(data.message,libraryStatus); await renderAuditLogs(1); }
    catch(error){setStatus(error.message||"บันทึกเอกสารไม่สำเร็จ",libraryStatus);}
});
if (libraryList) libraryList.addEventListener("click", async event => {
    const editId=event.target.dataset.editLibrary, deleteId=event.target.dataset.deleteLibrary;
    if(editId) fillLibraryForm(dbLibraryDocuments.find(item=>item.id===editId));
    if(deleteId){const item=dbLibraryDocuments.find(entry=>entry.id===deleteId);if(!item||!confirm(`ต้องการลบ "${item.title}" ใช่หรือไม่`))return;try{const data=await apiRequest("admin_library.php?action=delete",{method:"POST",body:JSON.stringify({id:deleteId})});await loadLibraryDocuments();renderLibraryDocuments();emptyLibraryForm();setStatus(data.message,libraryStatus);await renderAuditLogs(1);}catch(error){setStatus(error.message,libraryStatus);}}
});
if(examForm)examForm.addEventListener('submit',async e=>{e.preventDefault();try{const d=await apiRequest('admin_exams.php?action=save',{method:'POST',body:new FormData(examForm)});await loadExamPosts();renderExamPosts();emptyExamForm();setStatus(d.message,examStatus);await renderAuditLogs(1);}catch(err){setStatus(err.message||'บันทึกไม่สำเร็จ',examStatus);}});
if(examList)examList.addEventListener('click',async e=>{const edit=e.target.dataset.editExam,del=e.target.dataset.deleteExam;if(edit)fillExamForm(dbExamPosts.find(x=>x.id===edit));if(del){const x=dbExamPosts.find(i=>i.id===del);if(!x||!confirm(`ต้องการลบ "${x.title}" ใช่หรือไม่`))return;try{const d=await apiRequest('admin_exams.php?action=delete',{method:'POST',body:JSON.stringify({id:del})});await loadExamPosts();renderExamPosts();emptyExamForm();setStatus(d.message,examStatus);await renderAuditLogs(1);}catch(err){setStatus(err.message,examStatus);}}});
if(registrationForm)registrationForm.addEventListener('submit',async e=>{e.preventDefault();try{const d=await apiRequest('admin_registration.php?action=save',{method:'POST',body:new FormData(registrationForm)});await loadRegistrationPlans();renderRegistrationPlans();emptyRegistrationForm();setStatus(d.message,registrationStatus);await renderAuditLogs(1);}catch(err){setStatus(err.message||'บันทึกไม่สำเร็จ',registrationStatus);}});
if(registrationList)registrationList.addEventListener('click',async e=>{const edit=e.target.dataset.editRegistration,del=e.target.dataset.deleteRegistration;if(edit)fillRegistrationForm(dbRegistrationPlans.find(x=>x.id===edit));if(del){const x=dbRegistrationPlans.find(i=>i.id===del);if(!x||!confirm(`ต้องการลบ "${x.title}" ใช่หรือไม่`))return;try{const d=await apiRequest('admin_registration.php?action=delete',{method:'POST',body:JSON.stringify({id:del})});await loadRegistrationPlans();renderRegistrationPlans();emptyRegistrationForm();setStatus(d.message,registrationStatus);await renderAuditLogs(1);}catch(err){setStatus(err.message,registrationStatus);}}});
if (siteNoticeForm) {
    siteNoticeForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(siteNoticeForm);
        try {
            const data = await apiRequest("admin_site_settings.php?action=save", {
                method: "POST",
                body: JSON.stringify({ noticeText: getFormValue(formData, "noticeText") })
            });
            setStatus(data.message || "บันทึกประกาศหน้าแรกเรียบร้อยแล้ว", siteNoticeStatus);
            await renderAuditLogs(1);
        } catch (error) {
            setStatus(error.message || "บันทึกประกาศหน้าแรกไม่สำเร็จ", siteNoticeStatus);
        }
    });
}

if (calendarList) {
    calendarList.addEventListener("click", async (event) => {
        const editId = event.target.dataset.editCalendar;
        const deleteId = event.target.dataset.deleteCalendar;
        if (editId) fillCalendarForm(dbCalendarEvents.find((item) => item.id === editId));
        if (deleteId) {
            const item = dbCalendarEvents.find((entry) => entry.id === deleteId);
            if (!item || !window.confirm(`ต้องการลบ "${item.title}" ใช่หรือไม่`)) return;
            try {
                const data = await apiRequest("admin_calendar.php?action=delete", { method: "POST", body: JSON.stringify({ id: deleteId }) });
                await loadCalendarEvents();
                renderCalendarEvents();
                emptyCalendarForm();
                setStatus(data.message, calendarStatus);
                await renderAuditLogs(1);
            } catch (error) {
                setStatus(error.message || "ลบกิจกรรมไม่สำเร็จ", calendarStatus);
            }
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

if (list) {
    list.addEventListener("click", (event) => {
        const page = Number(event.target.dataset.newsPage || 0);
        if (page > 0) {
            newsPage = page;
            renderAdminList();
        }
    });
}

if (memberList) {
    memberList.addEventListener("click", (event) => {
        const page = Number(event.target.dataset.memberPage || 0);
        if (page > 0) {
            memberPage = page;
            renderAdminMembers();
        }
    });
}

document.querySelector("[data-new-news]").addEventListener("click", emptyForm);
document.querySelector("[data-reset-news]").addEventListener("click", emptyForm);
form.elements.type.addEventListener("change", () => {
    configureNewsTypeFields(form.elements.type.value);
});
document.querySelector("[data-reset-admin-member]").addEventListener("click", emptyMemberForm);
document.querySelector("[data-reset-calendar]")?.addEventListener("click", emptyCalendarForm);
document.querySelector("[data-reset-library]")?.addEventListener("click", emptyLibraryForm);
document.querySelector("[data-reset-exam]")?.addEventListener("click", emptyExamForm);
document.querySelector("[data-reset-registration]")?.addEventListener("click", emptyRegistrationForm);
document.querySelector("[data-clear-audit-log]").addEventListener("click", () => renderAuditLogs(historyPage));
document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_USER_KEY);
    window.location.href = "admin_logout.php";
});

loadDashboard();
