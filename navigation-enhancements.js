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

    window.showPage = function (page) {
        originalShowPage(page);
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
