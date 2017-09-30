(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$state', '$translate', 'Authentication', 'TorrentsService', 'Notification', 'MeanTorrentConfig',
    'getStorageLangService', 'DownloadService', '$timeout', 'localStorageService', 'ScrapeService'];

  function HomeController($scope, $state, $translate, Authentication, TorrentsService, Notification, MeanTorrentConfig, getStorageLangService,
                          DownloadService, $timeout, localStorageService, ScrapeService) {
    var vm = this;
    vm.tmdbConfig = MeanTorrentConfig.meanTorrentConfig.tmdbConfig;
    vm.appConfig = MeanTorrentConfig.meanTorrentConfig.app;
    vm.scrapeConfig = MeanTorrentConfig.meanTorrentConfig.scrapeTorrentStatus;
    vm.announce = MeanTorrentConfig.meanTorrentConfig.announce;
    vm.torrentType = MeanTorrentConfig.meanTorrentConfig.torrentType;

    vm.movieTopOne = undefined;
    vm.movieTopList = undefined;
    vm.movieNewList = undefined;

    vm.TVTopOne = undefined;
    vm.TVTopList = undefined;
    vm.TVNewList = undefined;

    $(document).ready(function () {
      $('#warning_popup').popup({
        outline: false,
        focusdelay: 400,
        vertical: 'top',
        autoopen: false,
        opacity: 0.6,
        closetransitionend: function () {
          $('.popup_wrapper').remove();
        }
      });
    });

    /**
     * If user is not signed in then redirect back signin
     */
    if (!Authentication.user) {
      $state.go('authentication.signin');
    }

    /**
     * initTopOneInfo
     */
    vm.initTopOneMovieInfo = function () {
      if (vm.movieTopOne.resource_detail_info.backdrop_path) {
        $('.movie-backdrop').css('backgroundImage', 'url(' + vm.tmdbConfig.backdropImgBaseUrl + vm.movieTopOne.resource_detail_info.backdrop_path + ')');
      }
    };

    /**
     * initTopOneTVInfo
     */
    vm.initTopOneTVInfo = function () {
      if (vm.TVTopOne.resource_detail_info.backdrop_path) {
        $('.tv-backdrop').css('backgroundImage', 'url(' + vm.tmdbConfig.backdropImgBaseUrl + vm.TVTopOne.resource_detail_info.backdrop_path + ')');
      }
    };

    /**
     * getTorrentTypeEnabled
     */
    vm.getTorrentTypeEnabled = function (t) {
      var enb = false;
      angular.forEach(vm.torrentType.value, function (tc) {
        if (tc.value === t) {
          enb = tc.enable;
        }
      });
      return enb;
    };

    /**
     * getWarningInfo
     */
    vm.getWarningInfo = function () {
      var sw = localStorageService.get('showed_warning');
      if (vm.appConfig.showDemoWarningPopup && !sw) {
        $timeout(function () {
          $('#warning_popup').popup('show');
          //$('.warning_popup_open').trigger('click');
          //angular.element('#myselector').triggerHandler('click');
        }, 300);

        localStorageService.set('showed_warning', true);
      }
      if (sw) {
        $('.popup_wrapper').remove();
      }
    };

    /**
     * getMovieTopInfo
     */
    vm.getMovieTopInfo = function () {
      vm.moviesInfo = TorrentsService.get({
        torrent_status: 'reviewed',
        torrent_type: 'movie',
        limit: 9
      }, function (items) {
        if (items.rows.length > 0) {
          vm.movieTopOne = items.rows[0];
          items.rows.splice(0, 1);
          vm.movieTopList = items.rows;

          vm.initTopOneMovieInfo();

          if (!vm.announce.privateTorrentCmsMode && vm.scrapeConfig.onTorrentInHome) {
            ScrapeService.scrapeTorrent(vm.movieTopOne);
            ScrapeService.scrapeTorrent(vm.movieTopList);
          }
        }
      }, function (err) {
        Notification.error({
          message: '<i class="glyphicon glyphicon-remove"></i> ' + $translate.instant('TOP_MOVIE_INFO_ERROR')
        });
      });

      vm.moviesInfo = TorrentsService.get({
        torrent_status: 'reviewed',
        torrent_type: 'movie',
        newest: true,
        limit: 14
      }, function (items) {
        if (items.rows.length > 0) {
          vm.movieNewList = items.rows;

          if (!vm.announce.privateTorrentCmsMode && vm.scrapeConfig.onTorrentInHome) {
            ScrapeService.scrapeTorrent(vm.movieNewList);
          }
        }
      }, function (err) {
        Notification.error({
          message: '<i class="glyphicon glyphicon-remove"></i> ' + $translate.instant('TOP_MOVIE_INFO_ERROR')
        });
      });
    };

    /**
     * getTVTopInfo
     */
    vm.getTVTopInfo = function () {
      vm.tvsInfo = TorrentsService.get({
        torrent_status: 'reviewed',
        torrent_type: 'tvserial',
        limit: 9
      }, function (items) {
        if (items.rows.length > 0) {
          vm.TVTopOne = items.rows[0];
          items.rows.splice(0, 1);
          vm.TVTopList = items.rows;

          vm.initTopOneTVInfo();

          if (!vm.announce.privateTorrentCmsMode && vm.scrapeConfig.onTorrentInHome) {
            ScrapeService.scrapeTorrent(vm.TVTopOne);
            ScrapeService.scrapeTorrent(vm.TVTopList);
          }
        }
      });

      vm.moviesInfo = TorrentsService.get({
        torrent_status: 'reviewed',
        torrent_type: 'tvserial',
        newest: true,
        limit: 14
      }, function (items) {
        if (items.rows.length > 0) {
          vm.TVNewList = items.rows;

          if (!vm.announce.privateTorrentCmsMode && vm.scrapeConfig.onTorrentInHome) {
            ScrapeService.scrapeTorrent(vm.TVNewList);
          }
        }
      });
    };

    /**
     * openTorrentInfo
     * @param id
     */
    vm.openTorrentInfo = function (id) {
      var url = $state.href('torrents.view', {torrentId: id});
      window.open(url, '_blank');
    };

    /**
     * downloadTorrent
     * @param id
     */
    vm.downloadTorrent = function (id) {
      var url = '/api/torrents/download/' + id;
      DownloadService.downloadFile(url, null, function (status) {
        if (status === 200) {
          Notification.success({
            message: '<i class="glyphicon glyphicon-ok"></i> ' + $translate.instant('TORRENTS_DOWNLOAD_SUCCESSFULLY')
          });
        }
      }, function (err) {
        Notification.error({
          title: 'ERROR',
          message: '<i class="glyphicon glyphicon-remove"></i> ' + $translate.instant('TORRENT_DOWNLOAD_ERROR')
        });
      });
    };
  }
}());
