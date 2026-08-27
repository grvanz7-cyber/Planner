// ========================================
// PAGE NAVIGATION ENHANCEMENTS
// ========================================

(function () {
    const originalShowPage = window.showPage;

    function setActiveNav(page) {
        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        const activeItem = document.querySelector(
            `.nav-item[data-page="${page}"]`
        );

        if (activeItem) {
            activeItem.classList.add("active");
        }
    }

    function showOnlyPage(page) {
        const pages = {
            dashboard: document.querySelector("#dashboardPage"),
            calendar: document.querySelector("#calendarPage"),
            settings: document.querySelector("#settingsPage")
        };

        Object.values(pages).forEach(element => {
            if (element) element.classList.add("page-hidden");
        });

        if (pages[page]) {
            pages[page].classList.remove("page-hidden");
        }
    }

    window.showPage = function (page) {
        const validPages = ["dashboard", "calendar", "settings"];
        if (!validPages.includes(page)) page = "dashboard";

        // Keep the existing navigation behaviour, then explicitly
        // control all pages so Calendar can be displayed as well.
        originalShowPage(page);
        showOnlyPage(page);
        setActiveNav(page);
        history.replaceState(null, "", `#${page}`);

        if (page === "calendar" && typeof renderCalendar === "function") {
            renderCalendar();
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const page = window.location.hash.replace("#", "");
        const validPages = ["dashboard", "calendar", "settings"];
        const initialPage = validPages.includes(page) ? page : "dashboard";
        window.showPage(initialPage);
    });
})();
