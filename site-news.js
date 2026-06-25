const NEWS_STORAGE_KEY = "schoolAdminNews";
const ADMIN_SESSION_KEY = "schoolAdminSession";
const ADMIN_SESSION_USER_KEY = "schoolAdminSessionUser";
const ADMIN_USERS_STORAGE_KEY = "schoolAdminUsers";
const ADMIN_AUDIT_STORAGE_KEY = "schoolAdminAuditLogs";
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

const defaultImage = "https://www.mueangnakhonsidole.com/images/thumbnails/mod_minifrontpage/55_125.webp";

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

const defaultNews = [
    {
        id: "news-1",
        type: "public",
        title: "ปฐมนิเทศนักศึกษาใหม่ ภาคเรียนที่ 1 ปีการศึกษา 2569",
        summary: "โรงเรียนจัดกิจกรรมปฐมนิเทศเพื่อชี้แจงแนวทางการเรียน การวัดผล และบริการสนับสนุนนักศึกษา พร้อมเปิดระบบติดตามผลการเรียนออนไลน์",
        category: "ข่าวเด่น",
        date: "12 พฤษภาคม 2569",
        author: "งานประชาสัมพันธ์",
        image: defaultImage,
        status: "published"
    },
    {
        id: "news-2",
        type: "public",
        title: "อบรมทักษะดิจิทัลสำหรับนักศึกษาผู้ใหญ่",
        summary: "เสริมความรู้การใช้แอปพลิเคชันเพื่อการเรียนรู้ การค้นคว้า และการประกอบอาชีพในชีวิตประจำวัน",
        category: "กิจกรรม",
        date: "8 พฤษภาคม 2569",
        author: "กลุ่มงานการศึกษาต่อเนื่อง",
        image: "https://www.mueangnakhonsidole.com/images/thumbnails/mod_minifrontpage/54_125.webp",
        status: "published"
    },
    {
        id: "job-1",
        type: "job",
        title: "ครูอัตราจ้าง วิชาเทคโนโลยีดิจิทัล",
        summary: "จำนวน 1 อัตรา ปฏิบัติงานด้านการจัดการเรียนการสอนและพัฒนาสื่อออนไลน์สำหรับนักศึกษาผู้ใหญ่",
        category: "เปิดรับสมัคร",
        date: "10-24 พฤษภาคม 2569",
        author: "งานบุคคล",
        metaOne: "รับสมัคร: 10-24 พฤษภาคม 2569",
        metaTwo: "คุณวุฒิ: ปริญญาตรีสาขาที่เกี่ยวข้อง",
        displayStatus: "เปิดรับสมัคร",
        status: "published"
    },
    {
        id: "job-2",
        type: "job",
        title: "วิทยากรหลักสูตรอาชีพระยะสั้น",
        summary: "รับสมัครวิทยากรด้านอาหาร งานหัตถกรรม และการตลาดออนไลน์ เพื่อจัดอบรมให้ประชาชนในพื้นที่",
        category: "เปิดรับสมัคร",
        date: "15-30 พฤษภาคม 2569",
        author: "งานส่งเสริมอาชีพ",
        metaOne: "รับสมัคร: 15-30 พฤษภาคม 2569",
        metaTwo: "คุณสมบัติ: มีประสบการณ์สอนหรือประกอบอาชีพจริง",
        displayStatus: "เปิดรับสมัคร",
        status: "published"
    },
    {
        id: "job-3",
        type: "job",
        title: "เจ้าหน้าที่ธุรการโครงการส่งเสริมการเรียนรู้",
        summary: "สนับสนุนงานเอกสาร ประสานงานผู้เรียน และจัดทำรายงานผลการดำเนินงานประจำเดือน",
        category: "ปิดรับสมัคร",
        date: "1-9 พฤษภาคม 2569",
        author: "งานบุคคล",
        metaOne: "รับสมัคร: 1-9 พฤษภาคม 2569",
        metaTwo: "สถานะ: อยู่ระหว่างตรวจสอบคุณสมบัติ",
        displayStatus: "ปิดรับสมัคร",
        status: "published"
    },
    {
        id: "proc-1",
        type: "procurement",
        title: "จัดซื้อวัสดุการเรียนการสอนสำหรับภาคเรียนที่ 1/2569",
        summary: "ประกาศราคากลางสำหรับการจัดซื้อวัสดุการเรียนการสอน",
        category: "ประกาศราคากลาง",
        date: "14 พ.ค. 2569",
        announcementNo: "พญ. 03/2569",
        displayStatus: "เผยแพร่",
        status: "published"
    },
    {
        id: "proc-2",
        type: "procurement",
        title: "จ้างปรับปรุงระบบเครือข่ายอินเทอร์เน็ตห้องเรียนคอมพิวเตอร์",
        summary: "ประกาศเชิญชวนยื่นข้อเสนอปรับปรุงระบบเครือข่ายอินเทอร์เน็ต",
        category: "ประกาศเชิญชวน",
        date: "9 พ.ค. 2569",
        announcementNo: "พญ. 02/2569",
        displayStatus: "รับข้อเสนอ",
        status: "published"
    },
    {
        id: "proc-3",
        type: "procurement",
        title: "ประกาศผู้ชนะการเสนอราคาจ้างผลิตสื่อประชาสัมพันธ์รับสมัครนักศึกษา",
        summary: "ประกาศผลผู้ชนะการเสนอราคาการจ้างผลิตสื่อประชาสัมพันธ์",
        category: "ประกาศผู้ชนะ",
        date: "2 พ.ค. 2569",
        announcementNo: "พญ. 01/2569",
        displayStatus: "เสร็จสิ้น",
        status: "published"
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
    ...item
});

const getNews = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(NEWS_STORAGE_KEY) || "null");
        if (Array.isArray(saved)) {
            const hasTypedItems = saved.some((item) => item.type);
            const migrationItems = hasTypedItems ? [] : defaultNews.filter((item) => item.type !== "public");
            return [...saved, ...migrationItems].map(normalizeItem);
        }
        const items = defaultNews;
        return items.map(normalizeItem);
    } catch (error) {
        return defaultNews.map(normalizeItem);
    }
};

const saveNews = (items) => {
    localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(items.map(normalizeItem)));
};

const publishedNews = (type = "public") => getNews().filter((item) => item.type === type && item.status === "published");

const pillClass = (category = "") => {
    if (category.includes("กิจกรรม")) return "purple";
    if (category.includes("อาชีพ")) return "green";
    return "";
};

const metaText = (item) => [item.date, item.author].filter(Boolean).join(" | ");

const statusClass = (value = "") => {
    if (value.includes("ปิด") || value.includes("เสร็จ")) return "closed";
    return "open";
};

const renderHomeNews = () => {
    const grid = document.querySelector("[data-home-news-grid]");
    if (!grid) return;

    const items = publishedNews("public").slice(0, 3);
    if (!items.length) {
        grid.innerHTML = `<p class="news-empty">ยังไม่มีข่าวที่เผยแพร่</p>`;
        const heroTitle = document.querySelector(".hero-card h2");
        if (heroTitle) heroTitle.textContent = "ยังไม่มีข่าวที่เผยแพร่";
        return;
    }

    grid.innerHTML = items.map((item) => `
        <article class="news-card">
            <img src="${escapeHtml(item.image || defaultImage)}" alt="${escapeHtml(item.title)}">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
            </div>
        </article>
    `).join("");

    const lead = items[0];
    const hero = document.querySelector(".hero-card");
    if (hero && lead) {
        hero.querySelector("img").src = lead.image || defaultImage;
        hero.querySelector("img").alt = lead.title;
        hero.querySelector("h2").textContent = lead.title;
        hero.querySelector(".badge").textContent = lead.category || "ข่าวประชาสัมพันธ์";
    }
};

const renderNewsPage = () => {
    const feature = document.querySelector(".news-feature");
    const list = document.querySelector(".news-card-list");
    const latestBox = document.querySelector(".news-side-box:nth-child(2)");
    if (!feature || !list) return;

    const items = publishedNews("public");
    const lead = items[0];
    if (!items.length) {
        feature.innerHTML = `<div><span class="news-pill">ข่าวประชาสัมพันธ์</span><h3>ยังไม่มีข่าวที่เผยแพร่</h3><p>เมื่อบันทึกข่าวและตั้งสถานะเป็นเผยแพร่ รายการข่าวจะแสดงในหน้านี้</p></div>`;
        list.innerHTML = "";
        if (latestBox) latestBox.innerHTML = "<h3>ข่าวล่าสุด</h3><p>ยังไม่มีข่าวที่เผยแพร่</p>";
        return;
    }

    feature.innerHTML = `
        <img src="${escapeHtml(lead.image || defaultImage)}" alt="${escapeHtml(lead.title)}">
        <div>
            <span class="news-pill ${pillClass(lead.category)}">${escapeHtml(lead.category || "ข่าวเด่น")}</span>
            <h3>${escapeHtml(lead.title)}</h3>
            <p>${escapeHtml(lead.summary)}</p>
            <div class="news-meta">${escapeHtml(metaText(lead))}</div>
            <a class="read-more" href="#">อ่านต่อ</a>
        </div>
    `;

    list.innerHTML = items.slice(1).map((item) => `
        <article class="news-row">
            <img src="${escapeHtml(item.image || defaultImage)}" alt="${escapeHtml(item.title)}">
            <div>
                <span class="news-pill ${pillClass(item.category)}">${escapeHtml(item.category || "ข่าวประชาสัมพันธ์")}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
                <div class="news-meta">${escapeHtml(metaText(item))}</div>
            </div>
        </article>
    `).join("");

    if (latestBox) {
        latestBox.innerHTML = `<h3>ข่าวล่าสุด</h3>${items.slice(0, 3).map((item) => `<p>${escapeHtml(item.title)} ${escapeHtml(item.summary)}</p>`).join("")}`;
    }
};

const renderJobsPage = () => {
    const list = document.querySelector(".job-list");
    if (!list) return;

    const items = publishedNews("job");
    if (!items.length) {
        list.innerHTML = `<p class="news-empty">ยังไม่มีข่าวรับสมัครงานที่เผยแพร่</p>`;
        return;
    }

    list.innerHTML = items.map((item) => {
        const displayStatus = item.displayStatus || item.category || "เปิดรับสมัคร";
        return `
            <article class="job-card ${statusClass(displayStatus) === "closed" ? "muted" : ""}">
                <div class="job-status ${statusClass(displayStatus)}">${escapeHtml(displayStatus)}</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
                <div class="job-meta">
                    <span>${escapeHtml(item.metaOne || `รับสมัคร: ${item.date}`)}</span>
                    <span>${escapeHtml(item.metaTwo || item.author || "รายละเอียดเพิ่มเติม")}</span>
                </div>
                <a class="read-more" href="#">ดูรายละเอียด</a>
            </article>
        `;
    }).join("");
};

const renderProcurementPage = () => {
    const tableBody = document.querySelector(".procurement-table tbody");
    if (!tableBody) return;

    const items = publishedNews("procurement");
    if (!items.length) {
        tableBody.innerHTML = `<tr><td colspan="5">ยังไม่มีประกาศจัดซื้อจัดจ้างที่เผยแพร่</td></tr>`;
        return;
    }

    tableBody.innerHTML = items.map((item) => {
        const displayStatus = item.displayStatus || "เผยแพร่";
        return `
            <tr>
                <td>${escapeHtml(item.date)}</td>
                <td>${escapeHtml(item.announcementNo || "-")}</td>
                <td>${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.category || "ประกาศ")}</td>
                <td><span class="table-status ${statusClass(displayStatus) === "closed" ? "done" : "open"}">${escapeHtml(displayStatus)}</span></td>
            </tr>
        `;
    }).join("");
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

const renderAllDynamicContent = () => {
    renderHomeNews();
    renderNewsPage();
    renderJobsPage();
    renderProcurementPage();
};

document.addEventListener("DOMContentLoaded", () => {
    renderAllDynamicContent();
    initAdminLogin();
    initAdminRegistration();

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
        button.addEventListener("click", () => window.setTimeout(renderAllDynamicContent, 0));
    });
});
