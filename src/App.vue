<template>
  <v-app>
      <v-container fluid>
          <v-layout row align-center>
            <a href="http://127.0.0.1:8080"><span class="logo">re-Search</span></a>
            <v-text-field color="error" label="Search" v-model="searchTerm" v-on:keyup.enter="getResults"/>
            <v-btn color="error" v-on:click="getResults"><v-icon>search</v-icon></v-btn>
          </v-layout>
          <v-layout row align-center v-if="didYouMean" class="searchCorrection">Did you mean: {{ results.correctedSearchTerm }}</v-layout>
          <v-layout class="itemList" row>
          <v-list two-line v-if="showResult" class="resultListTile">
          <template v-for="(item, index) in results.documents">
            <v-list-tile :key="index" class="itemTile" @click="getFile(index)">
              <v-list-tile-content>
                <v-list-tile-title v-html="item.title" class="itemTitle" color="error"></v-list-tile-title>
                <v-list-tile-sub-title>{{item.highlights}}</v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider v-bind:key="index"></v-divider>
          </template>
        </v-list>
        <v-flex class="text-xs-center">
        <v-progress-circular indeterminate color="error" v-if="showProgress"></v-progress-circular>
        </v-flex>
        </v-layout>
        <v-layout row>
          <v-dialog v-model="showFile" width="1500px">
            <v-card class="dialogBox">
              <v-card-title class="dialogTitle">{{ fileData.title }}</v-card-title>
              <v-card-text class="dialogText"> {{ fileData.abstract }} <br/> <br/>Year: {{ fileData.year }} <br/> <br/> Authors: {{ fileData.author }} <br/> <br> <span v-if="showReferences">References: </span></v-card-text>
              <v-list two-line class="referenceList" v-if="showReferences">
                <template v-for="(item, index) in fileData.references">
                  <v-list-tile :key="index" @click="getReference(index)">
                    <v-list-tile-content>
                      <v-list-tile-title v-html="item.title"></v-list-tile-title>
                      </v-list-tile-content>
                     </v-list-tile>
                     <v-divider v-bind:key="index"></v-divider>
                  </template>
                </v-list>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" flat="flat" @click="goBack" v-if="showBackButton">Back</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="error" flat="flat" @click="showSimilarPapers(fileData.index)">Show Similar Papers</v-btn>
                <v-spacer></v-spacer>
                <v-spacer></v-spacer>
                <v-btn color="error" flat="flat" @click="showFile = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
       </v-layout>
      </v-container>
  </v-app>
</template>

<script>
const axios = require("axios");
const _ = require("lodash")
export default {
  data() {
    return {
      didYouMean: false,
      showProgress: false,
      showBackButton: false,
      showFile: false,
      referenceStack: [],
      showResult: false,
      showReferences: false,
      fileData: {},
      results: {},
      searchTerm: "",
      clipped: false,
      drawer: true,
      fixed: false,
      items: [{ icon: "bubble_chart", title: "Inspire" }],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: "reSearch",
      isLoading: false,
      items: [],
      model: null,
      search: null
    };
  },
  watch: {
      search (val) {

        this.isLoading = true

        // Lazily load input items
        axios.get('http://127.0.0.1:5000/autocomplete?query=' + this.search)
          .then(res => {
            console.log(res)
            this.items = res.data
          })
          .catch(err => {
            console.log(err)
          })
          .finally(() => (this.isLoading = false))
      }
    },
  methods: {
    getResults: function() {
      var self = this;
      var url = "http://localhost:5000/search?query=" + self.searchTerm;
      self.showProgress = true;
      axios.get(url).then(function(response) {
        self.showProgress = false;
        console.log(response.data);
        self.results = response.data;
        self.results.documents = _.orderBy(self.results.searchquerydocuments, "pagerank", "desc")
        self.results.documents = self.results.documents.concat(self.results.relatedquerydocuments)
        self.showResult = true;
        if (self.results.hasOwnProperty("correctedSearchTerm")) {
          self.didYouMean = true;
        } else {
          self.didYouMean = false;
        }
      });
    },
    getFile: function(event) {
      console.log(event);
      var self = this;
      var url = this.results.documents[event].path;
      axios.get(url).then(function(response) {
        console.log(response.data);
        self.fileData = response.data;
        self.showFile = true;
        if (response.data.references.length > 0) {
          self.showReferences = true;
        } else {
          self.showReferences = false;
        }
      });
      this.referenceStack.push(url)
    },
    showSimilarPapers: function(fileId) {
      var self = this;
      var url = "http://127.0.0.1:5000/similar/" + fileId
      axios.get(url).then(function(response) {
        self.showProgress = false;
        console.log("%j", response.data);
        self.results = response.data;
        self.results.documents = _.orderBy(self.results.searchquerydocuments, "pagerank", "desc")
        self.showResult = true;
        self.showFile = false;
        if (self.results.hasOwnProperty("correctedSearchTerm")) {
          self.didYouMean = true;
        } else {
          self.didYouMean = false;
        }
      });
    },
    getReference: function(index) {
      var self = this;
      var url = this.fileData.references[index].path;
      axios.get(url).then(function(response) {
        console.log(response.data);
        self.fileData = response.data;
        self.showFile = true;
        if (response.data.references.length > 0) {
          self.showReferences = true;
        } else {
          self.showReferences = false;
        }
      });
      this.referenceStack.push(url)
      this.showBackButton = true
    },
    goBack: function() {
      var self = this;
      this.referenceStack.pop()
      var url = this.referenceStack.pop()
      console.log(url)
      axios.get(url).then(function(response) {
        console.log(response.data);
        self.fileData = response.data;
        self.showFile = true;
        if (response.data.references.length > 0) {
          self.showReferences = true;
        } else {
          self.showReferences = false;
        }
      });
      if (this.referenceStack.length == 0) {
        this.showBackButton = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css?family=Share+Tech+Mono');
a {
  text-decoration: none;
}
.logo {
  font-family: "Share Tech Mono", monospace;
  margin-right: 20px;
  font-size: 40px;
  color: #f44336;
}
.itemList {
  margin-left: 350px;
}
.itemTile {
  padding-top: 10px;
  padding-bottom: 10px;
  color: #f44336;
}
.resultListTile {
  background-color: rgb(250, 250, 250);
  margin: -10px;
}

.dialogTitle {
  font-size: 40px;
}

.dialogText {
  font-size: 20px;
}
.referenceList {
  margin-left: 20px;
}

.dialogBox {
  padding: 30px;
}

.searchCorrection {
  padding: 20px;
  font-size: 20px;
}

.searchCorrection {
  margin: -10px;
}
</style>
