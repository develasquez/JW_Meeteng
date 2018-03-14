$(function() {
	electron.ipcRenderer.on("media", function(evt, media, c, d) {

		$(".videoContainer").hide();
		$(".imageContainer").hide();
		$(".audioContainer").hide();
		$("#video").attr("src", "");
		$("#audio").attr("src", "");

		switch (media.type) {
			case "AUDIO":
				{
					$(".yearText").hide();
					$(".audioContainer")
					.show()
					.css({
						"width": "100%",
						"height": "100%",
						"content": "&nbsp;",
						"background": "url('" + media.image + "')",
						"background-size": "auto 100%",
						"background-repeat": "no-repeat",
						"background-position": "center"
					});
					$(".row").css({
						"width": "100%",
						"height": "100%"
					});
					$("#audio").attr("src", media.url);
				}
				break;
			case "VIDEO":
				{
					$(".yearText").hide();
					$(".videoContainer")
					.show();
					$(".row").css({
						"width": "100%",
						"height": "100%"
					});
					$("#video").attr("src", media.url);
				}
				break;
			case "IMAGE":
				{
					$(".yearText").hide();
					$(".row").css({
						"width": "100%",
						"height": "100%"
					});
					$(".imageContainer")
					.show()
					.css({
						"width": "100%",
						"height": "100%",
						"content": "&nbsp;",
						"background": "url('" + media.url + "')",
						"background-size": "auto 100%",
						"background-repeat": "no-repeat",
						"background-position": "center"
					});
				}
				break;
		}
	});
});