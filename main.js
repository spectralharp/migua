'use strict';

(function () {
  // Initialize on window load
  window.addEventListener('load', init);

  const GRAIN_COUNT = 24;

  function init() {

    Vue.component('monogram', {
      props: ['isYang'],
      template: '<span ref="graphic" :class="yin"></span>',
      methods: {
        restartAnimation() {
          const element = this.$refs.graphic;
          element.classList.remove('reveal');
          void element.offsetWidth;
          element.classList.add('reveal');
        }
      },

      computed: {
        yin() { return `hexagram__symbol reveal ${this.isYang ? '' : 'yin'}` }
      },

      updated() {
        this.restartAnimation();
      }
    });

    Vue.component('application', {
      props: ['info'],
      template: '<li class="applications__item"><h3>{{ info.category }}</h3><p class="body-text">{{ info.reading }}</p></li>'
    });

    Vue.component('modal', {
      props: ['loading', 'hexagramData', 'hexagram', 'hide'],
      template:
        `
      <section class="modal"  ref="hexModal" v-on:click="checkHide($event)" v-on:touchEnd="checkHide($event)">
        <div class="modal__dialog">
          <div class="modal__header">
            <button class="btn-close" v-on:click="hide">×</button>
          </div>
          <div class="modal__content">
            <section class="result">
              <figure class="hexagram">
                <monogram v-for="(isYang, index) in hexagram" :is-yang="isYang" :key="\`modalHex-\${index}\`"></monogram>
              </figure>
              <figcaption v-cloak class="title">{{ loading ? '...' : info ? info.name : id }}</figcaption>
            </section>
            </br>
            <hr class="hr"/>
            <h2 class="title">{{ info.xiang.title }}</h2>
            <p class="body-text">{{ info.xiang.description }}</p>
            <h3>評曰</h3>
            <p class="body-text">{{ info.xiang.comment }}</p>

            <h2 class="title">掛意判斷</h2>
            <p class="body-text">{{ info.evaluation }}</p>

            <h2 class="title">卦象參考</h2>
            <p class="body-text">{{ info.reference }}</p>

            <h2 class="title">總結批論</h2>
            <p class="body-text">{{ info.summary }}</p>

            <h2 class="title">應用</h2>
            <ul class="applications">
              <li is="application" v-for="(app, index) in info.application" :info="app" :key="\`app-\${index}\`">
              </li>
            </ul>
            </br>
            <hr class="hr"/>
            </br>
          </div>
        </div>
      </section>
      `,
      methods: {
        checkHide(e) {
          if (e.target === this.$refs.hexModal) {
            this.hide();
          }
        }
      },

      computed: {
        info() {
          if (this.loading || !this.hexagram) return {
            name: '...',
            xiang: {
              title: '...',
              description: '...',
              comment: '...'
            },
            evaluation: '...',
            reference: '...',
            summary: '...',
            application: []
          }

          return this.hexagramData[this.hexagram.join('')];
        }
      },
    });

    const app = new Vue({
      el: '#root',

      data: {
        hexagramData: null,
        errored: false,
        loading: true,
        first: 0,
        second: 0,
        third: 0,
        showModal: false,
        modalHexagram: [0, 0, 0, 0, 0, 0]
      },

      computed: {
        first2Sum() {
          return parseInt(this.first) + parseInt(this.second);
        },
        bottom() {
          return this.getTrigram(parseInt(this.first));
        },
        top() {
          return this.getTrigram(parseInt(this.first) + parseInt(this.second));
        },
        result() {
          return this.top.concat(this.bottom);
        },
        change() {
          // Generate result hexagram
          const hexagram = [...this.result];
          // Generate hexagram with swapped monogram
          const index = (hexagram.length - 1) - ((parseInt(this.third) + 5) % hexagram.length);
          hexagram[index] = hexagram[index] ? 0 : 1;
          return hexagram;
        },
        resultId() {
          return this.top.join('') + this.bottom.join('');
        },
        changeId() {
          return this.change.join('');
        }
      },

      methods: {
        getTrigram(tri) {
          return this.toBinary(tri * 7 % 8);
        },
        toBinary(dec) {
          return (dec >>> 0).toString(2).padStart(3, '0').split('').map(x => parseInt(x)).reverse();
        },
        grabRice() {
          this.first = Math.ceil(Math.random() * GRAIN_COUNT);
          this.second = Math.ceil(Math.random() * GRAIN_COUNT);
          this.third = Math.ceil(Math.random() * GRAIN_COUNT);
        },
        show(toShow) {
          this.showModal = true;
          this.modalHexagram = toShow;
          document.body.style.overflow = 'hidden';
        },
        hide() {
          this.showModal = false;
          document.body.style.overflow = 'initial';
        },
        trigramName(number) {
          return '坤艮坎巽震離兌乾'[number % 8];
        },
        hexagramName(id) {
          if (this.loading) return '...';
          const idData = this.hexagramData[id];
          if (!idData) return '...';
          return idData.name;
        },
        moveNum(number) {
          return '六一二三四五'[number % 6];
        },
        changeName(bit) {
          bit = bit * 5 % 6;
          if(bit > 2) {
            bit -= 3;
            return this.trigramName(this.flipBit(parseInt(this.first) * 7 % 8, bit));
          } else {
            return this.trigramName(this.flipBit((parseInt(this.first) + parseInt(this.second)) * 7 % 8, bit));
          }
        },
        flipBit(n, bit) {
          return n ^ (1 << bit);
        }
      },

      mounted() {
        fetch('data.json')
          .then(response => response.json())
          .then(data => this.hexagramData = data)
          .catch(error => { console.error(error); this.errored = true; })
          .finally(() => this.loading = false)
      }
    });
  }

})();