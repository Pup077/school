const ADMIN_SESSION_KEY = "schoolAdminSession";
const ADMIN_SESSION_USER_KEY = "schoolAdminSessionUser";
const ADMIN_USERS_STORAGE_KEY = "schoolAdminUsers";
const ADMIN_AUDIT_STORAGE_KEY = "schoolAdminAuditLogs";
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
let databaseNews = null;
let publicSiteSettings = null;
let databaseCalendarEvents = [];
let homeHeroTimer = null;
let scheduleCalendarDate = new Date();
let scheduleCalendarUserSelected = false;
const PUBLIC_PAGE_SIZE = 5;
const publicPageState = {
    news: 1,
    jobs: 1,
    procurement: 1
};

const newsTypeLabels = {
    public: "ข่าวประชาสัมพันธ์",
    job: "ข่าวรับสมัครงาน",
    procurement: "จัดซื้อจัดจ้าง"
};

const defaultAdminUsers = [
    {
        id: "admin-1",
        username: ADMIN_USER,
        password: ADMIN_PASS,
        fullName: "ผู้ดูแลระบบ",
        role: "admin",
        status: "active",
        createdAt: "2026-05-01T09:00:00.000Z",
        lastLoginAt: ""
    }
];

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
}[char]));

const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const normalizeAdminUser = (user) => ({
    id: user.id || `admin-${Date.now()}`,
    username: user.username || "",
    password: user.password || "",
    fullName: user.fullName || user.full_name || "",
    role: user.role || "editor",
    status: user.status || (user.isActive === false ? "inactive" : "active"),
    createdAt: user.createdAt || user.created_at || new Date().toISOString(),
    lastLoginAt: user.lastLoginAt || user.last_login_at || ""
});

const getAdminUsers = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(ADMIN_USERS_STORAGE_KEY) || "null");
        if (Array.isArray(saved) && saved.length) {
            const users = saved.map(normalizeAdminUser);
            const hasDefaultAdmin = users.some((user) => user.username === ADMIN_USER);
            return hasDefaultAdmin ? users : [...users, ...defaultAdminUsers];
        }
        return defaultAdminUsers.map(normalizeAdminUser);
    } catch (error) {
        return defaultAdminUsers.map(normalizeAdminUser);
    }
};

const saveAdminUsers = (users) => {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users.map(normalizeAdminUser)));
};

const getCurrentAdmin = () => {
    const username = sessionStorage.getItem(ADMIN_SESSION_USER_KEY) || ADMIN_USER;
    return getAdminUsers().find((user) => user.username === username) || defaultAdminUsers[0];
};

const getAuditLogs = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
};

const saveAuditLog = ({ action, targetType, targetName, detail, actor } = {}) => {
    const currentAdmin = actor || getCurrentAdmin();
    const logs = getAuditLogs();
    logs.unshift({
        id: `log-${Date.now()}`,
        action: action || "update",
        targetType: targetType || "system",
        targetName: targetName || "-",
        detail: detail || "",
        actorUsername: currentAdmin.username || ADMIN_USER,
        actorName: currentAdmin.fullName || currentAdmin.username || "ผู้ดูแลระบบ",
        createdAt: new Date().toISOString()
    });
    localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 120)));
};

const registerAdminAccount = ({ username, password, fullName, role = "editor" }) => {
    const users = getAdminUsers();
    const nextUsername = String(username || "").trim();

    if (!nextUsername || !password || !String(fullName || "").trim()) {
        return { ok: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" };
    }

    if (users.some((user) => user.username.toLowerCase() === nextUsername.toLowerCase())) {
        return { ok: false, message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" };
    }

    const user = normalizeAdminUser({
        id: `admin-${Date.now()}`,
        username: nextUsername,
        password: String(password),
        fullName: String(fullName).trim(),
        role,
        status: "active",
        createdAt: new Date().toISOString()
    });

    users.unshift(user);
    saveAdminUsers(users);
    saveAuditLog({
        action: "create_admin",
        targetType: "admin_user",
        targetName: user.username,
        detail: `ลงทะเบียนผู้ดูแลระบบ ${user.fullName}`,
        actor: user
    });

    return { ok: true, message: "ลงทะเบียน admin เรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที", user };
};

const normalizeItem = (item) => ({
    type: "public",
    image: "",
    metaOne: "",
    metaTwo: "",
    announcementNo: "",
    displayStatus: "",
    documentUrl: "",
    documentName: "",
    documents: [],
    ...item
});

const getNews = () => {
    if (Array.isArray(databaseNews)) {
        return databaseNews.map(normalizeItem);
    }
    return [];
};

const isPublished = (item) => item.status === "published";

const publishedNews = (type = "public") => getNews().filter((item) => item.type === type && isPublished(item));

const allPublishedNews = () => getNews().filter(isPublished);

const applicationAndProcurementNews = () => allPublishedNews().filter((item) => ["job", "procurement"].includes(item.type));

const pillClass = (category = "") => {
    if (category.includes("กิจกรรม")) return "purple";
    if (category.includes("อาชีพ")) return "green";
    return "";
};

const metaText = (item) => [item.date, item.author].filter(Boolean).join(" | ");

const updateText = (item) => item.updatedAt ? `อัปเดตล่าสุด ${formatDateTime(item.updatedAt)}` : "";

const detailUrl = (item) => `news-detail.php?id=${encodeURIComponent(item.id)}`;

const documentsForItem = (item) => {
    if (Array.isArray(item.documents) && item.documents.length) {
        return item.documents;
    }

    if (item.documentUrl) {
        return [{
            id: item.id,
            url: item.documentUrl,
            name: item.documentName || "",
            legacy: true
        }];
    }

    return [];
};

const downloadUrl = (item, document = null) => {
    if (document?.id && !document.legacy) {
        return `download-document.php?document=${encodeURIComponent(document.id)}`;
    }
    return `download-document.php?id=${encodeURIComponent(item.id)}`;
};

const isPdfDocument = (document = {}) => {
    const value = String(document.name || document.url || "").split(/[?#]/)[0].toLowerCase();
    return value.endsWith(".pdf");
};

const splitDisplayDate = (dateText = "") => {
    const text = String(dateText || "").trim();
    const dayMatch = text.match(/\d{1,2}/);
    const monthMatch = text.match(/ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม/i);

    return {
        day: dayMatch ? dayMatch[0] : "ข่าว",
        month: monthMatch ? monthMatch[0] : "ล่าสุด"
    };
};

const splitCalendarDate = (item = {}) => {
    const iso = String(item.publishDate || "").trim();
    const isoMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
        return {
            day: String(date.getDate()),
            month: date.toLocaleDateString("th-TH", { month: "short" })
        };
    }

    return splitDisplayDate(item.date);
};

const eventTimestamp = (item = {}) => {
    const value = String(item.publishDate || "").trim();
    const timestamp = value ? new Date(`${value}T00:00:00`).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const scheduleDateValue = (item = {}) => {
    const value = String(item.publishDate || "").trim();
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const statusClass = (value = "") => {
    if (value.includes("ปิด") || value.includes("เสร็จ")) return "closed";
    return "open";
};

const pageCount = (itemCount) => Math.max(1, Math.ceil(itemCount / PUBLIC_PAGE_SIZE));

const currentPageItems = (items, page) => {
    const start = (page - 1) * PUBLIC_PAGE_SIZE;
    return items.slice(start, start + PUBLIC_PAGE_SIZE);
};

const renderContentPagination = (container, itemCount, currentPage, onPageChange) => {
    if (!container) return;

    const totalPages = pageCount(itemCount);
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const pageButtons = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return `<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}" aria-label="หน้า ${page}" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`;
    }).join("");

    container.innerHTML = `
        <button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>ก่อนหน้า</button>
        ${pageButtons}
        <button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>ถัดไป</button>
    `;

    container.querySelectorAll("button[data-page]:not(:disabled)").forEach((button) => {
        button.addEventListener("click", () => onPageChange(Number(button.dataset.page)));
    });
};

const scrollToNewsList = () => {
    document.querySelector(".news-list-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const publicNewsByCategory = (category) => publishedNews("public").filter((item) => item.category === category);

const renderHomeNews = () => {
    const grid = document.querySelector("[data-home-news-grid]");
    const hero = document.querySelector(".hero-card");
    if (!grid && !hero) return;

    const featuredItems = publicNewsByCategory("ข่าวเด่น").slice(0, 4);
    const heroItems = publicNewsByCategory("ข่าวประชาสัมพันธ์").slice(0, 6);
    const fallbackHeroItems = heroItems.length ? heroItems : publishedNews("public").slice(0, 6);

    if (grid) {
        if (!featuredItems.length) {
            grid.innerHTML = `<p class="news-empty">ยังไม่มีข่าวเด่นที่เผยแพร่</p>`;
        } else {
            grid.innerHTML = featuredItems.map((item) => `
                <article class="news-card">
                    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : ""}
                    <div>
                        <h3><a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a></h3>
                        <p>${escapeHtml(item.summary)}</p>
                    </div>
                </article>
            `).join("");
        }
    }

    if (!fallbackHeroItems.length) {
        const heroTitle = document.querySelector(".hero-card h2");
        if (heroTitle) heroTitle.textContent = "ยังไม่มีข่าวที่เผยแพร่";
        if (homeHeroTimer) window.clearInterval(homeHeroTimer);
        return;
    }

    const lead = fallbackHeroItems[0];
    if (hero && lead) {
        const setHeroItem = (item) => {
            const image = hero.querySelector("img");
            const title = hero.querySelector("h2");
            const badge = hero.querySelector(".badge");

            hero.classList.add("is-changing");
            window.setTimeout(() => {
                image.hidden = !item.image;
                image.src = item.image || "";
                image.alt = item.image ? item.title : "";
                title.innerHTML = `<a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a>`;
                badge.textContent = item.category || "ข่าวประชาสัมพันธ์";
                hero.onclick = () => {
                    window.location.href = detailUrl(item);
                };
                hero.classList.remove("is-changing");
            }, 180);
        };

        let heroIndex = 0;
        const showHeroAt = (index) => {
            heroIndex = (index + fallbackHeroItems.length) % fallbackHeroItems.length;
            setHeroItem(fallbackHeroItems[heroIndex]);
        };
        setHeroItem(lead);

        if (homeHeroTimer) window.clearInterval(homeHeroTimer);
        if (fallbackHeroItems.length > 1) {
            homeHeroTimer = window.setInterval(() => {
                showHeroAt(heroIndex + 1);
            }, 4500);
        }

        const prevButton = hero.querySelector("[data-hero-prev]");
        const nextButton = hero.querySelector("[data-hero-next]");
        [prevButton, nextButton].forEach((button) => {
            if (!button) return;
            button.hidden = fallbackHeroItems.length <= 1;
            button.disabled = fallbackHeroItems.length <= 1;
        });
        if (prevButton) {
            prevButton.onclick = (event) => {
                event.stopPropagation();
                if (homeHeroTimer) window.clearInterval(homeHeroTimer);
                showHeroAt(heroIndex - 1);
            };
        }
        if (nextButton) {
            nextButton.onclick = (event) => {
                event.stopPropagation();
                if (homeHeroTimer) window.clearInterval(homeHeroTimer);
                showHeroAt(heroIndex + 1);
            };
        }
    }
};

const renderHomeNotice = () => {
    const notice = document.querySelector("[data-home-notice]");
    if (!notice) return;

    const text = String(publicSiteSettings?.noticeText || "").trim();
    notice.textContent = text || "ยังไม่มีประกาศในขณะนี้";
};

const renderUrgentNewsList = () => {
    const list = document.querySelector("[data-urgent-news-list]");
    if (!list) return;

    const items = applicationAndProcurementNews().slice(0, 5);
    if (!items.length) {
        list.innerHTML = `<p class="news-empty">ยังไม่มีข่าวประกาศด่วน</p>`;
        return;
    }

    list.innerHTML = items.map((item) => `
        <div class="mini-item">
            <a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a>
            <span>${escapeHtml(item.date || newsTypeLabels[item.type] || "ข่าว")}</span>
        </div>
    `).join("");
};

const renderActivityGallery = () => {
    const gallery = document.querySelector("[data-activity-gallery]");
    if (!gallery) return;

    const items = publishedNews("public").filter((item) => item.image).slice(0, 5);
    const fallbackItems = publishedNews("public").slice(0, 5);
    const displayItems = items.length ? items : fallbackItems;

    if (!displayItems.length) {
        gallery.innerHTML = `<p class="news-empty">ยังไม่มีภาพกิจกรรมที่เผยแพร่</p>`;
        return;
    }

    gallery.innerHTML = displayItems.map((item) => `
        <article class="activity-card">
            <a href="${escapeHtml(detailUrl(item))}">
                ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : ""}
                <span>${escapeHtml(item.category || newsTypeLabels[item.type] || "กิจกรรม")}</span>
                <h3>${escapeHtml(item.title)}</h3>
            </a>
        </article>
    `).join("");
};

const renderDownloadSection = () => {
    const grid = document.querySelector("[data-download-grid]");
    if (!grid) return;

    const sourceItems = applicationAndProcurementNews();
    const documents = sourceItems.filter((item) => documentsForItem(item).length).slice(0, 3);
    const displayItems = documents.length ? documents : sourceItems.slice(0, 3);

    if (!displayItems.length) {
        grid.innerHTML = `<p class="news-empty">ยังไม่มีเอกสารดาวน์โหลด</p>`;
        return;
    }

    grid.innerHTML = displayItems.map((item) => {
        const itemDocuments = documentsForItem(item);
        const firstDocument = itemDocuments[0] || null;
        const hasDocument = Boolean(firstDocument);
        const isPdf = hasDocument && isPdfDocument(firstDocument);
        const href = hasDocument ? downloadUrl(item, firstDocument) : detailUrl(item);
        return `
            <article class="download-box">
                <span class="download-type">${escapeHtml(newsTypeLabels[item.type] || "ข่าว")}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(firstDocument?.name || item.summary || item.date || "ดูรายละเอียดเพิ่มเติม")}</p>
                <a class="more" href="${escapeHtml(href)}" ${isPdf ? 'target="_blank" rel="noopener"' : ''}>${hasDocument ? (isPdf ? "เปิด PDF" : "ดาวน์โหลด") : "ดูรายละเอียด"}</a>
            </article>
        `;
    }).join("");
};

const downloadArchiveItems = () => applicationAndProcurementNews().flatMap((item) => (
    documentsForItem(item).map((document) => ({
        item,
        document,
        name: document.name || item.documentName || "เอกสารแนบ",
        type: item.type,
        title: item.title,
        date: item.date || item.publishDate || ""
    }))
));

const renderDownloadsArchive = () => {
    const list = document.querySelector("[data-download-archive-list]");
    const filter = document.querySelector("[data-download-filter]");
    if (!list) return;

    const keyword = String(filter?.elements?.keyword?.value || "").trim().toLowerCase();
    const type = String(filter?.elements?.type?.value || "all");
    const items = downloadArchiveItems().filter(({ item, name }) => {
        const matchType = type === "all" || item.type === type;
        const text = `${item.title} ${item.summary} ${name} ${item.date}`.toLowerCase();
        return matchType && (!keyword || text.includes(keyword));
    });

    if (!items.length) {
        list.innerHTML = `<p class="news-empty">ไม่พบเอกสารดาวน์โหลด</p>`;
        return;
    }

    list.innerHTML = items.map(({ item, document, name }) => `
        <article class="download-archive-item">
            <div>
                <span>${escapeHtml(newsTypeLabels[item.type] || "ข่าว")} ${item.date ? `/ ${escapeHtml(item.date)}` : ""}</span>
                <h3><a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a></h3>
                <p>${escapeHtml(name)}</p>
            </div>
            <a class="read-more" href="${escapeHtml(downloadUrl(item, document))}" ${isPdfDocument(document) ? 'target="_blank" rel="noopener"' : ''}>${isPdfDocument(document) ? "เปิด PDF" : "ดาวน์โหลด"}</a>
        </article>
    `).join("");
};

const initDownloadsArchiveFilter = () => {
    const filter = document.querySelector("[data-download-filter]");
    if (!filter) return;

    filter.addEventListener("input", renderDownloadsArchive);
    filter.addEventListener("change", renderDownloadsArchive);
    filter.addEventListener("submit", (event) => event.preventDefault());
};

const renderEventCalendar = () => {
    const grid = document.querySelector("[data-event-calendar]");
    if (!grid) return;

    const items = [...scheduleItems()]
        .sort((a, b) => eventTimestamp(b) - eventTimestamp(a))
        .slice(0, 4);
    if (!items.length) {
        grid.innerHTML = `<p class="news-empty">ยังไม่มีกิจกรรมที่เผยแพร่</p>`;
        return;
    }

    grid.innerHTML = items.map((item) => {
        const dateParts = splitCalendarDate(item);
        return `
            <article class="calendar-card">
                <div class="calendar-event-card">
                    <div class="calendar-date">
                        <strong>${escapeHtml(dateParts.day)}</strong>
                        <span>${escapeHtml(dateParts.month)}</span>
                    </div>
                    <div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description || item.typeLabel || "กิจกรรมตามปฏิทิน")}</p>
                    </div>
                </div>
            </article>
        `;
    }).join("");
};

const automaticThaiCalendarEvents = () => {
    const currentYear = scheduleCalendarDate.getFullYear();
    const definitions = [
        [1, 1, "วันขึ้นปีใหม่", "holiday"], [1, 16, "วันครู", "important"],
        [4, 6, "วันจักรี", "holiday"], [4, 13, "วันสงกรานต์", "holiday"],
        [4, 14, "วันสงกรานต์", "holiday"], [4, 15, "วันสงกรานต์", "holiday"],
        [5, 1, "วันแรงงานแห่งชาติ", "holiday"], [5, 4, "วันฉัตรมงคล", "holiday"],
        [6, 3, "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี", "holiday"],
        [6, 26, "วันต่อต้านยาเสพติดโลก", "important"], [7, 28, "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว", "holiday"],
        [8, 12, "วันแม่แห่งชาติ", "holiday"], [9, 20, "วันเยาวชนแห่งชาติ", "important"],
        [10, 13, "วันนวมินทรมหาราช", "holiday"], [10, 23, "วันปิยมหาราช", "holiday"],
        [12, 5, "วันพ่อแห่งชาติ", "holiday"], [12, 10, "วันรัฐธรรมนูญ", "holiday"], [12, 31, "วันสิ้นปี", "holiday"]
    ];
    return [currentYear - 1, currentYear, currentYear + 1].flatMap((year) => definitions.map(([month, day, title, type]) => ({
        id: `auto-${year}-${month}-${day}`, title, description: type === "holiday" ? "วันหยุดประจำปี (แสดงอัตโนมัติ)" : "วันสำคัญ (แสดงอัตโนมัติ)",
        publishDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, type, typeLabel: type === "holiday" ? "วันหยุด" : "วันสำคัญ", automatic: true
    })));
};

const scheduleItems = () => [...databaseCalendarEvents, ...automaticThaiCalendarEvents()]
    .filter((item) => scheduleDateValue(item))
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b));

const renderScheduleCalendarPage = () => {
    const calendar = document.querySelector("[data-schedule-calendar]");
    const list = document.querySelector("[data-schedule-list]");
    const title = document.querySelector("[data-schedule-month]");
    if (!calendar && !list) return;

    const items = scheduleItems();
    if (!items.length) {
        if (calendar) calendar.innerHTML = `<p class="news-empty">ยังไม่มีกำหนดการที่เผยแพร่</p>`;
        if (list) list.innerHTML = `<p class="news-empty">ยังไม่มีกำหนดการที่เผยแพร่</p>`;
        return;
    }

    if (!scheduleCalendarUserSelected) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingItem = items.find((item) => {
            const date = scheduleDateValue(item);
            return date && date.getTime() >= today.getTime();
        }) || items[items.length - 1];
        const date = scheduleDateValue(upcomingItem);
        if (date) scheduleCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    const month = scheduleCalendarDate.getMonth();
    const year = scheduleCalendarDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();
    const monthTitle = scheduleCalendarDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    if (title) title.textContent = monthTitle;

    const itemsByDate = items.reduce((map, item) => {
        const date = scheduleDateValue(item);
        if (!date) return map;
        const key = dateKey(date);
        if (!map[key]) map[key] = [];
        map[key].push(item);
        return map;
    }, {});

    if (calendar) {
        const cells = [];
        for (let i = 0; i < startOffset; i += 1) {
            cells.push(`<div class="schedule-day is-empty"></div>`);
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            const current = new Date(year, month, day);
            const key = dateKey(current);
            const dayItems = itemsByDate[key] || [];
            cells.push(`
                <div class="schedule-day ${dayItems.length ? "has-event" : ""}">
                    <strong>${escapeHtml(day)}</strong>
                    ${dayItems.slice(0, 2).map((item) => `<span class="schedule-event ${escapeHtml(item.type || "school")}">${escapeHtml(item.title)}</span>`).join("")}
                    ${dayItems.length > 2 ? `<span>+${escapeHtml(dayItems.length - 2)} รายการ</span>` : ""}
                </div>
            `);
        }
        calendar.innerHTML = cells.join("");
    }

    if (list) {
        const monthItems = items.filter((item) => {
            const date = scheduleDateValue(item);
            return date && date.getFullYear() === year && date.getMonth() === month;
        });

        list.innerHTML = monthItems.length ? monthItems.map((item) => {
            const parts = splitCalendarDate(item);
            return `
                <article class="schedule-list-item">
                    <div class="calendar-date">
                        <strong>${escapeHtml(parts.day)}</strong>
                        <span>${escapeHtml(parts.month)}</span>
                    </div>
                    <div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description || item.typeLabel || "กิจกรรมตามปฏิทิน")}</p>
                    </div>
                </article>
            `;
        }).join("") : `<p class="news-empty">ยังไม่มีกำหนดการในเดือนนี้</p>`;
    }
};

const initScheduleCalendarControls = () => {
    const calendar = document.querySelector("[data-schedule-calendar]");
    if (!calendar) return;

    document.querySelector("[data-schedule-prev]")?.addEventListener("click", () => {
        scheduleCalendarUserSelected = true;
        scheduleCalendarDate = new Date(scheduleCalendarDate.getFullYear(), scheduleCalendarDate.getMonth() - 1, 1);
        renderScheduleCalendarPage();
    });
    document.querySelector("[data-schedule-next]")?.addEventListener("click", () => {
        scheduleCalendarUserSelected = true;
        scheduleCalendarDate = new Date(scheduleCalendarDate.getFullYear(), scheduleCalendarDate.getMonth() + 1, 1);
        renderScheduleCalendarPage();
    });
    document.querySelector("[data-schedule-today]")?.addEventListener("click", () => {
        scheduleCalendarUserSelected = true;
        scheduleCalendarDate = new Date();
        renderScheduleCalendarPage();
    });
};

const renderNewsPage = () => {
    const feature = document.querySelector(".news-feature");
    const list = document.querySelector(".news-card-list");
    const latestBox = document.querySelector(".news-side-box:nth-child(2)");
    const pagination = document.querySelector("[data-news-pagination]");
    if (!feature || !list) return;

    const items = publishedNews("public");
    if (!items.length) {
        feature.innerHTML = `<div><span class="news-pill">ข่าวประชาสัมพันธ์</span><h3>ยังไม่มีข่าวที่เผยแพร่</h3><p>เมื่อบันทึกข่าวและตั้งสถานะเป็นเผยแพร่ รายการข่าวจะแสดงในหน้านี้</p></div>`;
        list.innerHTML = "";
        if (pagination) pagination.innerHTML = "";
        if (latestBox) latestBox.innerHTML = "<h3>ข่าวล่าสุด</h3><p>ยังไม่มีข่าวที่เผยแพร่</p>";
        return;
    }

    const totalPages = pageCount(items.length);
    publicPageState.news = Math.min(publicPageState.news, totalPages);
    const pageItems = currentPageItems(items, publicPageState.news);
    const lead = pageItems[0];

    feature.innerHTML = `
        ${lead.image ? `<img src="${escapeHtml(lead.image)}" alt="${escapeHtml(lead.title)}">` : ""}
        <div>
            <span class="news-pill ${pillClass(lead.category)}">${escapeHtml(lead.category || "ข่าวเด่น")}</span>
            <h3><a href="${escapeHtml(detailUrl(lead))}">${escapeHtml(lead.title)}</a></h3>
            <p>${escapeHtml(lead.summary)}</p>
            <div class="news-meta">${escapeHtml([metaText(lead), updateText(lead)].filter(Boolean).join(" | "))}</div>
            <a class="read-more" href="${escapeHtml(detailUrl(lead))}">อ่านต่อ</a>
        </div>
    `;

    list.innerHTML = pageItems.slice(1).map((item) => `
        <article class="news-row">
            ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : ""}
            <div>
                <span class="news-pill ${pillClass(item.category)}">${escapeHtml(item.category || "ข่าวประชาสัมพันธ์")}</span>
                <h3><a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a></h3>
                <p>${escapeHtml(item.summary)}</p>
                <div class="news-meta">${escapeHtml([metaText(item), updateText(item)].filter(Boolean).join(" | "))}</div>
            </div>
        </article>
    `).join("");

    if (latestBox) {
        latestBox.innerHTML = `<h3>ข่าวล่าสุด</h3>${items.slice(0, 3).map((item) => `<a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a>`).join("")}`;
    }

    renderContentPagination(pagination, items.length, publicPageState.news, (page) => {
        publicPageState.news = page;
        renderNewsPage();
        scrollToNewsList();
    });
};

const renderJobsPage = () => {
    const list = document.querySelector(".job-list");
    const pagination = document.querySelector("[data-jobs-pagination]");
    if (!list) return;

    const items = publishedNews("job");
    if (!items.length) {
        list.innerHTML = `<p class="news-empty">ยังไม่มีข่าวรับสมัครงานที่เผยแพร่</p>`;
        if (pagination) pagination.innerHTML = "";
        return;
    }

    const totalPages = pageCount(items.length);
    publicPageState.jobs = Math.min(publicPageState.jobs, totalPages);
    const pageItems = currentPageItems(items, publicPageState.jobs);

    list.innerHTML = pageItems.map((item) => {
        const displayStatus = item.displayStatus || item.category || "เปิดรับสมัคร";
        return `
            <article class="job-card ${statusClass(displayStatus) === "closed" ? "muted" : ""}">
                <div class="job-status ${statusClass(displayStatus)}">${escapeHtml(displayStatus)}</div>
                <h3><a href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a></h3>
                <p>${escapeHtml(item.summary)}</p>
                <div class="job-meta">
                    <span>${escapeHtml(item.metaOne || `รับสมัคร: ${item.date}`)}</span>
                    <span>${escapeHtml(item.metaTwo || item.author || "รายละเอียดเพิ่มเติม")}</span>
                    ${updateText(item) ? `<span>${escapeHtml(updateText(item))}</span>` : ""}
                </div>
                <a class="read-more" href="${escapeHtml(detailUrl(item))}">ดูรายละเอียด</a>
            </article>
        `;
    }).join("");

    renderContentPagination(pagination, items.length, publicPageState.jobs, (page) => {
        publicPageState.jobs = page;
        renderJobsPage();
        scrollToNewsList();
    });
};

const renderProcurementPage = () => {
    const tableBody = document.querySelector(".procurement-table tbody");
    const pagination = document.querySelector("[data-procurement-pagination]");
    if (!tableBody) return;

    const items = publishedNews("procurement");
    if (!items.length) {
        tableBody.innerHTML = `<tr><td colspan="3">ยังไม่มีประกาศจัดซื้อจัดจ้างที่เผยแพร่</td></tr>`;
        if (pagination) pagination.innerHTML = "";
        return;
    }

    const totalPages = pageCount(items.length);
    publicPageState.procurement = Math.min(publicPageState.procurement, totalPages);
    const pageItems = currentPageItems(items, publicPageState.procurement);

    tableBody.innerHTML = pageItems.map((item) => {
        const displayStatus = item.displayStatus || "อยู่ระหว่างจัดซื้อ";
        return `
            <tr>
                <td>${escapeHtml(item.date)}${updateText(item) ? `<small class="table-update">${escapeHtml(updateText(item))}</small>` : ""}</td>
                <td><a class="table-link" href="${escapeHtml(detailUrl(item))}">${escapeHtml(item.title)}</a></td>
                <td><span class="table-status ${statusClass(displayStatus) === "closed" ? "done" : "open"}">${escapeHtml(displayStatus)}</span></td>
            </tr>
        `;
    }).join("");

    renderContentPagination(pagination, items.length, publicPageState.procurement, (page) => {
        publicPageState.procurement = page;
        renderProcurementPage();
        scrollToNewsList();
    });
};

const initAdminLogin = () => {
    const form = document.querySelector("[data-admin-login-form]");
    if (!form) return;

    const message = document.querySelector("[data-admin-login-message]");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const username = String(formData.get("username") || "").trim();
        const password = String(formData.get("password") || "");

        const users = getAdminUsers();
        const user = users.find((item) => (
            item.username === username &&
            item.password === password &&
            item.status === "active"
        ));

        if (user) {
            user.lastLoginAt = new Date().toISOString();
            saveAdminUsers(users);
            sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
            sessionStorage.setItem(ADMIN_SESSION_USER_KEY, user.username);
            window.location.href = "admin-dashboard.html";
            return;
        }

        if (message) message.textContent = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    });
};

const initAdminRegistration = () => {
    const form = document.querySelector("[data-admin-register-form]");
    if (!form) return;

    const message = document.querySelector("[data-admin-register-message]");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const password = String(formData.get("password") || "");
        const confirmPassword = String(formData.get("confirmPassword") || "");

        if (password !== confirmPassword) {
            if (message) message.textContent = "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
            return;
        }

        const result = registerAdminAccount({
            username: formData.get("username"),
            password,
            fullName: formData.get("fullName"),
            role: formData.get("role") || "editor"
        });

        if (message) message.textContent = result.message;
        if (result.ok) form.reset();
    });
};

const showRegisterSuccessPopup = () => {
    const popup = document.createElement("div");
    popup.className = "admin-register-popup";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");

    let remaining = 3;
    popup.innerHTML = `
        <div class="admin-register-popup-card">
            <strong>ลงทะเบียนเสร็จแล้ว</strong>
            <p>ระบบจะพากลับไปหน้าเข้าสู่ระบบใน <span data-register-countdown>${remaining}</span> วินาที</p>
        </div>
    `;
    document.body.appendChild(popup);

    const countdown = popup.querySelector("[data-register-countdown]");
    const timer = window.setInterval(() => {
        remaining -= 1;
        if (countdown) countdown.textContent = String(Math.max(remaining, 0));

        if (remaining <= 0) {
            window.clearInterval(timer);
            window.location.href = "index.html";
        }
    }, 1000);
};

const initAdminPhpMessages = () => {
    const params = new URLSearchParams(window.location.search);
    const loginMessage = document.querySelector("[data-admin-login-message]");
    const registerMessage = document.querySelector("[data-admin-register-message]");

    const loginMessages = {
        required: "กรุณาเข้าสู่ระบบก่อนเข้า Dashboard",
        empty: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        failed: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        db_error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ MySQL",
    };

    const registerMessages = {
        success: "ลงทะเบียน admin ลงฐานข้อมูลเรียบร้อยแล้ว",
        empty: "กรุณากรอกข้อมูลให้ครบถ้วน",
        short_password: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        password_mismatch: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
        duplicate: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว",
        db_error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ MySQL",
    };

    if (loginMessage) {
        const key = params.get("login");
        if (key && loginMessages[key]) loginMessage.textContent = loginMessages[key];
        if (params.get("logout") === "success") loginMessage.textContent = "ออกจากระบบเรียบร้อยแล้ว";
    }

    if (registerMessage) {
        const key = params.get("register");
        if (key && registerMessages[key]) registerMessage.textContent = registerMessages[key];
        if (key === "success") showRegisterSuccessPopup();
    }
};

const formatRemainingMinutes = (seconds = 0) => {
    const minutes = Math.max(1, Math.ceil(Number(seconds || 0) / 60));
    return `${minutes} นาที`;
};

const formatStatNumber = (value = 0) => Number(value || 0).toLocaleString("th-TH");

const initVisitorStats = async () => {
    const box = document.querySelector("[data-visitor-stats]");
    if (!box) return;

    const total = box.querySelector("[data-visitor-total]");
    const today = box.querySelector("[data-visitor-today]");
    const online = box.querySelector("[data-visitor-online]");
    const updated = box.querySelector("[data-visitor-updated]");

    try {
        const page = document.body?.dataset?.page || "index";
        const response = await fetch(`visitor_stats.php?page=${encodeURIComponent(page)}`, {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        const data = await response.json();

        if (!data.ok || !data.stats) {
            throw new Error("Visitor stats unavailable");
        }

        if (total) total.textContent = formatStatNumber(data.stats.total);
        if (today) today.textContent = formatStatNumber(data.stats.today);
        if (online) online.textContent = formatStatNumber(data.stats.online);
        if (updated) updated.textContent = `อัปเดตล่าสุด ${formatDateTime(data.stats.updatedAt)}`;
    } catch (error) {
        if (total) total.textContent = "-";
        if (today) today.textContent = "-";
        if (online) online.textContent = "-";
        if (updated) updated.textContent = "ยังไม่สามารถโหลดสถิติได้ กรุณาตรวจสอบฐานข้อมูล";
    }
};

const initScrollTopButtons = () => {
    document.querySelectorAll("[data-scroll-top]").forEach((button) => {
        button.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
};

const initAdminSessionStatus = async () => {
    const box = document.querySelector("[data-admin-session-box]");
    const form = document.querySelector(".admin-login-panel .admin-login-form");
    if (!box || !form) return;

    try {
        const response = await fetch("auth_status.php", {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        const data = await response.json();

        if (!data.ok || !data.loggedIn || !data.user) {
            box.hidden = true;
            box.style.display = "none";
            form.hidden = false;
            form.style.display = "";
            return;
        }

        form.hidden = true;
        form.style.display = "none";
        box.hidden = false;
        box.style.display = "";
        box.innerHTML = `
            <strong>ยังอยู่ในระบบ</strong>
            <p>${escapeHtml(data.user.fullName || data.user.username)} (${escapeHtml(data.user.role)})</p>
            <small>Session จะหมดอายุในประมาณ ${escapeHtml(formatRemainingMinutes(data.remainingSeconds))}</small>
            <div class="admin-session-actions">
                <button type="button" data-admin-session-dashboard>เข้า Dashboard</button>
                <button class="secondary" type="button" data-admin-session-logout>ออกจากระบบ</button>
            </div>
        `;

        box.querySelector("[data-admin-session-dashboard]").addEventListener("click", () => {
            window.location.href = "admin-dashboard.php";
        });
        box.querySelector("[data-admin-session-logout]").addEventListener("click", () => {
            window.location.href = "admin_logout.php";
        });
    } catch (error) {
        box.hidden = true;
        box.style.display = "none";
        form.hidden = false;
        form.style.display = "";
    }
};

const renderAllDynamicContent = () => {
    renderHomeNews();
    renderHomeNotice();
    renderUrgentNewsList();
    renderActivityGallery();
    renderDownloadSection();
    renderDownloadsArchive();
    renderEventCalendar();
    renderScheduleCalendarPage();
    renderNewsPage();
    renderJobsPage();
    renderProcurementPage();
};

const loadDatabaseNews = async () => {
    try {
        const response = await fetch("public_news.php", {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        const data = await response.json();
        if (data.ok && Array.isArray(data.news)) {
            databaseNews = data.news;
            renderAllDynamicContent();
        }
    } catch (error) {
        databaseNews = null;
    }
};

const loadDatabaseCalendar = async () => {
    try {
        const response = await fetch("public_calendar.php", { headers: { "Accept": "application/json" }, cache: "no-store" });
        const data = await response.json();
        databaseCalendarEvents = data.ok && Array.isArray(data.events) ? data.events.map((item) => ({ ...item, publishDate: item.date })) : [];
        renderEventCalendar();
        renderScheduleCalendarPage();
    } catch (error) {
        databaseCalendarEvents = [];
        renderEventCalendar();
        renderScheduleCalendarPage();
    }
};

const loadPublicSiteSettings = async () => {
    try {
        const response = await fetch("public_site_settings.php", {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        const data = await response.json();
        if (!data.ok) throw new Error(data.message || "Settings unavailable");
        publicSiteSettings = data.settings || {};
    } catch (error) {
        publicSiteSettings = {};
    }
    renderHomeNotice();
};

document.addEventListener("DOMContentLoaded", () => {
    renderAllDynamicContent();
    loadDatabaseNews();
    loadDatabaseCalendar();
    loadPublicSiteSettings();
    initAdminLogin();
    initAdminRegistration();
    initAdminPhpMessages();
    initAdminSessionStatus();
    initVisitorStats();
    initScrollTopButtons();
    initDownloadsArchiveFilter();
    initScheduleCalendarControls();

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
        button.addEventListener("click", () => window.setTimeout(renderAllDynamicContent, 0));
    });
});
