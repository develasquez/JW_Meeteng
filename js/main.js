var Media = require("./media");
var Promise = require("bluebird");
var _ = require("lodash");
var baseUrl = "https://wol.jw.org";
var currentWeek = "";


var main = {
    init: function() {
        Media.getCurrentWeek().then(function(thisWeek) {
            currentWeek = thisWeek.name;
            main.setCurrentWeek();
            Media.getWatchtower(thisWeek).then(function(media) {
                main.getWatchtowerMedia(media);
            });
        });
        main.getWeeks();
        main.setEvents();
        main.getSongs();
        setTimeout(function() {
            $("#songs").height($(".content").height());
        }, 1000);
    },
    setEvents: function() {
        $(".expandWeeks").on("click", function() {
            monomer.showDialog("#popupWeeks");
        });
        window.onresize = function(event) {
            $("#songs").height($(".content").height());
        };
        $(".findSong input").on("keyup",function(evt){
            $("#songs li").show();
            if($(this).val().length > 0){
                $("#songs li:not(:contains('"+ $(this).val() +"'))").hide();    
            }
            
        })
    },
    getWeeks: function() {
        monomer.showLoading();
        Media.getGuides().then(function(data) {

            console.log("Guides Ready")
            if (!localStorage.getItem("guides")) {
                localStorage.setItem("guides", data);
            } else if (localStorage.getItem("guides").length = data.length) {
                if (localStorage.getItem("guides")) {
                    $.each(localStorage.getItem("weeks"), _.bind(main.setWeeks, this));
                    monomer.hideLoading();
                } else {
                    return;
                }
            }
            var weeks = [];
            $.each(data, function(i, e) {
                weeks.push(Media.getWeeks(baseUrl + e.url));
            });

            Promise.all(weeks).then(function(weeksData) {
                weeksData = _.flatten(_.compact(weeksData));
                if (!localStorage.getItem("weeks")) {
                    localStorage.setItem("weeks", weeksData);
                } else if (localStorage.getItem("weeks").length = weeksData.length) {
                    return
                }
                $.each(weeksData, _.bind(main.setWeeks, this));
                monomer.hideLoading();
            })
        });
    },
    setWeeks: function(i, e) {
        $(".weeks")
            .append($("<li>")
                .addClass("week")
                .data("week", e)
                .text(e.week)
                .on("click", function() {
                    monomer.hideDialog("#popupWeeks");
                    main.getMedia($(this).data("week"))
                })
            );
    },
    setCurrentWeek: function() {
        var weeks = localStorage.getItem("weeks");
        main.getMedia(_.filter(weeks, function(w) {
            return w.week == currentWeek
        })[0])

    },
    getMedia: function(week) {
        monomer.showLoading();
        $(".weekTitle").text(week.week);
        Media.getMedia(baseUrl + week.url).then(function(data) {

            monomer.hideLoading();
            $(".mediaList").html("");
            $.each(data, function(i, e) {
                $(".mediaList").append($(list(e)).data("media", e).on("click", function(evt) {
                    electron.ipcRenderer.send("media", $(this).data("media"));
                }));
            });
        });
    },
    getWatchtowerMedia: function(data) {
        monomer.showLoading();
        $(".wTitle").text(currentWeek.wName);
        $(".wMediaList").html("");
        $.each(data, function(i, e) {
            $(".wMediaList").append($(list(e)).data("media", e).on("click", function(evt) {
                electron.ipcRenderer.send("media", $(this).data("media"));
            }));
        });

    },
    getSongs: function() {
        Media.getSongs().then(function(data) {
            $.each(data, function(i, e) {
                $("#songs").append($(song(e)).data("media", e).on("click", function(evt) {
                    electron.ipcRenderer.send("media", $(this).data("media"));
                }));
            });
        });
    }
};

var song = function(data) {
    return [
        '<li>',
        '<div>',
        '<div class="test_box fab">',
        data.number,
        '</div>',
        '</div>',
        '<div>',
        '<div>',
        '<h3>' + data.name + '</h3>',
        '</div>',
        '<span class="expand-config button-right icon-ellipsis-v icon-1x icon-black trackOptions" target=".configMenu">',
        '</span>',
        '</div>',
        '</li>',
    ].join("\n");
};

var list = function(data) {
    var image = data.image || data.url;

    return [
        '<div class="thumb">',
        '<img src="' + image + '" alt="' + data.name + '"> ',
        '<div>',
        '<span class="title">' + data.name + '</span>'
    ].join("\n");
};


$(main.init);