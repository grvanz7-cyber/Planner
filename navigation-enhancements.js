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

        const hash = page === "dashboard" ? "dashboard" : page;
        history.replaceState(null, "", `#${hash}`);
    };

    document.addEventListener("DOMContentLoaded", () => {
        const page = window.location.hash.replace("#", "");
        const initialPage = page === "settings" ? "settings" : "dashboard";

        window.showPage(initialPage);
    });
})();
