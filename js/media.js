var request = require('request');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var _ = require("lodash");

var baseUrl = "https://wol.jw.org";

var langs = "https://wol.jw.org/es/wol/sysl/r4/lp-s";
var guidesUrl = "https://wol.jw.org/es/wol/lv/r4/lp-s/0/21585";
var songsBase = "https://download-a.akamaihd.net/files/media_music/c7/sjjm_S_{number}_r720P.mp4";
var songsListUrl = "https://apps.jw.org/GETPUBMEDIALINKS?output=html&pub=sjjm&fileformat=M4V%2CMP4%2C3GP&alllangs=1&langwritten=S&txtCMSLang=S";
var apiFinder = "https://data.jw-api.org/mediator/finder?item=";
var apiMedi = "https://data.jw-api.org/mediator/v1/media-items/S/";
var bibleBooks = "https://apps.jw.org/GETPUBMEDIALINKS?output=html&pub=nwtsv&fileformat=M4V%2CMP4%2C3GP&alllangs=1&langwritten=S&txtCMSLang=S";
var songsCount = 151;
var weekProgramUrl = "https://wol.jw.org/es/wol/dt/r4/lp-s/";
var songsList = [];
var Media = {
	getWatchtower: function() {
		Media.getCurrentWeek().then(function(thisWeek) {

		});

		//leer Programa
		//Leer Estudio 
		//Leer Imagenes
		//leer canciones	
	},
	getCurrentWeek: function() {
		return new Promise(function(resolve, reject) {
			var date = new Date();
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			var day = date.getDate();
			request(`${weekProgramUrl}${year}/${month}/${day}`, function(err, xhr, body) {
				var $ = cheerio.load(body);
				resolve({
					name: $("[class*='pub-mwb'] .docTitle").text(),
					body: body
				});

			});
		});
	},
	getSongs: function() {
		return new Promise(function(resolve, reject) {
			var pad = "000";
			request(songsListUrl, function(err, xhr, body) {
				var $ = cheerio.load(body);

				$(".aVideoURL").each(function(i, e) {
					var number = $(e).parent("td").text().split(".")[0].trim().replace("&nbsp;");
					var name = $(e).parent("td").text().split(".")[1];
					const mediaLink = $(e).attr("href");
					songsList.push({
						url: mediaLink.indexOf("http") > -1 ? mediaLink : `${baseUrl}${mediaLink}`,
						name: name,
						number: number,
						type: "VIDEO"
					});
				});
				resolve(songsList);
			});
		});
	},
	getGuides: function() {
		return new Promise(function(resolve, reject) {
			console.log("Fetching Guide");
			request(guidesUrl, function(err, xhr, body) {
				console.log("browse Guide");
				try {
					var $ = cheerio.load(body);
					var guides = [];
					$(".row.card a").each(function(i, e) {
						guides.push({
							url: $(e).attr("href") || "NULL",
							month: $(e).find(".cardTitle .sourceTitle").text() || "",
							image: $(e).find(".thumbnail").attr("src") || "NULL"
						});
					});
					resolve(guides);
				} catch (ex) {
					console.log(ex);
					resolve(null);
				}
			});
		});
	},
	getWeeks: function(monthUrl) {
		return new Promise(function(resolve, reject) {
			console.log("Fetching Week" + monthUrl);
			request(monthUrl, function(err, xhr, body) {
				console.log("Browse Week");
				try {
					var $ = cheerio.load(body);
					var weeks = [];
					$(".row.card a").each(function(i, e) {
						if ($(e).find("span.title").text().match(/(([1-9]{1,2})+?(-|[a-z ]{1,20})+?([1-9]{1,2})+?)/)) {
							weeks.push({
								url: $(e).attr("href") || "NULL",
								week: $(e).find("span.title").text() || "",
								image: $(e).find(".thumbnail").attr("src") || "NULL"
							});
						}
					});
					resolve(weeks);
				} catch (ex) {
					console.log(ex);
					resolve(null);
				}
			});
		});
	},
	getMedia: function(weekUrl) {
		return new Promise(function(resolve, reject) {
			request(weekUrl, function(err, xhr, body) {
				try {
					var $ = cheerio.load(body);
					var urlMedia = [];
					$(".su a:not(.b):not(.fn), .sw a:not(.b):not(.fn)").each(function(order, e) {
						console.log("push - " +$(e).text() );
						urlMedia.push(new Promise(function(resolveMedia, reject) {
							let mUrl;
							try {
							mUrl = $(e).attr("href").indexOf("http") > -1 ? $(e).attr("href") : `${baseUrl}${$(e).attr("href")}`;

							mUrl = mUrl.replace(apiFinder, apiMedi).replace("&lang=S", "");
							var objUrl = getParams(mUrl);
							if (objUrl.issue) {

								var type = ($(e).attr("data-audio") || "").length > 0 ? "AUDIO" : "VIDEO";
								mUrl = apiMedi + "pub-mwbv_" + objUrl.issue + "_" + objUrl.track + "_" + type
							}
							}catch(ex){
								console.log(ex);
							}
							console.log("request - " + $(e).text() );
							request(mUrl, function(err, xhr, bodyArticle) {
								console.log("response");
								try {
									if (err) {
										console.log("resolveMedia");
										resolveMedia({
											url: "",
											name: $(e).text() || "Media"
										});
										return;
									}
									var newMedia = null;
									try {
										newMedia = JSON.parse(bodyArticle).media[0];
									} catch (ex) {}

									if (newMedia) {
										console.log("resolveMedia");
										resolveMedia({
											url: _.filter(newMedia.files, function(file) {
												return file.progressiveDownloadURL.indexOf("720") > -1 || file.progressiveDownloadURL.indexOf("mp3") > -1
											})[0].progressiveDownloadURL || "NULL",
											image: newMedia.images.lsr.lg,
											duration: newMedia.durationFormattedHHMM,
											name: newMedia.title,
											type: newMedia.type.toUpperCase()
										});
										return;
									} else {
										$$ = cheerio.load(bodyArticle);
										var sources = [];
										$$("figure img, [src*='.mp4'], [src*='.mp3']").each(function(ind, el) {
											const mediaLink = $$(el).attr("src") || $$(el).attr("href");
											var url = mediaLink.indexOf("http") > -1 ? mediaLink : `${baseUrl}${mediaLink}`;
											sources.push({
												url: url,
												name: $(e).text() || "Media",
												subOrder: ind,
												type: "IMAGE",
											});
										});
										if (sources.length > 0) {
											console.log("resolveMedia");
											resolveMedia(sources);
											return;
										} else {
											if ($(e).text().indexOf("Canción") > -1) {
												console.log("resolveMedia");
												resolveMedia({
													url: _.filter(songsList, function(s) {
														return s.number == parseInt(($(e).text()).match(/[0-9]{1,3}/))
													})[0].url,
													image: "https://assetsnffrgf-a.akamaihd.net/assets/a/sjjm/univ/wpub/sjjm_univ_lg.jpg",
													name: $(e).text(),
													type: "VIDEO"
												});
												return;
											}
										}
									}
								} catch (ex) {
									console.log(ex);
								}
								console.log("resolveMedia");
								resolveMedia({
									url: "",
									name: $(e).text() || "Media"
								});
								return;
							});
						}));
					});
				} catch (ex) {
					console.log(ex);
				}
				Promise.all(urlMedia).then(function(data) {
					var finalMedia = _.filter(_.flatten(data), function(m){
						return m.url.length > baseUrl.length;
					});
					resolve(finalMedia);
				});
			});
		});
	}
}

var getParams = function(url) {
	var vars = [],
		hash;
	var hashes = url.slice(url.indexOf("?") + 1).split("&");
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split("=");
		vars[hash[0]] = hash[1];
	}
	return vars;
}

module.exports = Media;