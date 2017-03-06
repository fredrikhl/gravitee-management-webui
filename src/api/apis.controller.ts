/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as _ from 'lodash';

export class ApisController {

  private apis: any;
  private views: any[];
  private graviteeUIVersion: string;
  private apisScrollAreaHeight: number;
  private isAPIsHome: boolean;
  private createMode: boolean;
  private devMode: boolean;
  private syncStatus: any;
  private NotificationService: any;
  private portalTitle: string;

  constructor(
    private ApiService,
    private $mdDialog,
    private $scope,
    private $state: ng.ui.IStateService,
    private Constants,
    private Build,
    private resolvedApis,
    private graviteeUser,
    private $q: ng.IQService,
    resolvedViews: any[]
  ) {
    'ngInject';

    this.graviteeUser = graviteeUser;
    this.portalTitle = Constants.portalTitle;
    this.graviteeUIVersion = Build.version;
    this.apis = resolvedApis.data;

    this.apisScrollAreaHeight = this.$state.current.name === 'apis.list' ? 195 : 90;
    this.isAPIsHome = this.$state.includes('apis');

    this.createMode = !Constants.devMode; // && Object.keys($rootScope.graviteeUser).length > 0;

    this.views = resolvedViews;

    this.reloadSyncState();

    $scope.$on('$stateChangeStart', function() {
      $scope.hideApis = true;
    });
  }

  reloadSyncState() {
    let promises = _.map(this.apis, (api: any) => {
      if (this.isOwner(api) && !this.devMode) {
        return this.ApiService.isAPISynchronized(api.id)
          .then((sync) => { return sync; });
      }
    });

    this.$q.all( _.filter( promises, ( p ) => { return p !== undefined; } ) )
      .then((syncList) => {
        this.syncStatus = _.fromPairs(_.map(syncList, (sync: any) => {
          return [sync.data.api_id, sync.data.is_synchronized];
        }));
      });
  }

  update(api) {
    this.ApiService.update(api).then(() => {
      this.$scope.formApi.$setPristine();
      this.NotificationService.show('Api updated with success');
    });
  }

  // backToPreviousState() {
  //   if (!this.$scope.previousState) {
  //     this.$scope.previousState = 'apis.list';
  //   }
  //   this.$state.go(this.$scope.previousState, {}, {reload: true});
  // }

  getVisibilityIcon(api) {
    switch (api.visibility) {
      case 'public':
        return 'public';
      case 'restricted':
        return 'vpn_lock';
      case 'private':
        return 'lock';
    }
  }

  getVisibility(api) {
    switch (api.visibility) {
      case 'public':
        return 'Public';
      case 'restricted':
        return 'Restricted';
      case 'private':
        return 'Private';
    }
  }

  isOwner(api) {
    return api.permission && (api.permission === 'owner' || api.permission === 'primary_owner');
  }

  showImportDialog() {
    var that = this;
    this.$mdDialog.show({
      controller: 'DialogApiImportController',
      controllerAs: 'dialogApiImportCtrl',
      template: require('./admin/general/dialog/apiImport.dialog.html'),
      apiId: '',
      clickOutsideToClose: true
    }).then(function (response) {
      if (response) {
        that.$state.go('apis.admin.general', {apiId: response.data.id}, {reload: true});
      }
    });
  }

  // TODO : template not found !?
  // showImportSwaggerDialog() {
  //   this.$mdDialog.show({
  //     controller: 'DialogApiSwaggerImportController',
  //     controllerAs: 'dialogApiSwaggerImportCtrl',
  //     template: require('./admin/creation/swagger/importSwagger.dialog.html'),
  //     apiId: '',
  //     clickOutsideToClose: true
  //   }).then(function (api) {
  //     if (api) {
  //       this.$state.go('apis.new', {api: api});
  //     }
  //   });
  // }
}

export default ApisController;