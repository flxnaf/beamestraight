<template>
  <div>
    <!-- 导航组件封装 -->
    <NavigationHK></NavigationHK>

    <div>
      <div class="computer" style="position: relative">
        <div style="overflow: hidden">
          <img
            v-if="equipment == 'pc'"
            class="computer_img_top"
            src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner-newyear.png"
            alt="Beame 透明牙箍預約，獨家 $0 檢查費，網上預約箍牙諮詢。"
          />
        </div>
        <div style="overflow: hidden">
          <img
            v-if="equipment == 'move'"
            class="move_img"
            src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner-newyear2.png?x-oss-process=image/resize,w_1500/format,webp"
            alt="Beame 透明牙箍預約，獨家 $0 檢查費，網上預約箍牙諮詢。"
          />
        </div>
        <!-- <div class="computer_div">
          <h1 class="computer_h1">香港透明牙箍</h1>
          <h2 class="computer_h2">箍牙獨家 $0 檢查費</h2>
          <p class="computer_p">
            <i style="color: rgb(36, 206, 123)" class="el-icon-location"></i
            >尖沙咀︱中環︱銅鑼灣︱觀塘︱南昌︱沙田︱佐敦
          </p>
          <div v-if="equipment == 'pc'">
            <a href="javascript:void(0)"
              ><button @click="jump('Rule1')" class="deta_button_3">
                立即預約箍牙諮詢
              </button></a
            ><br />
          </div>
        </div>
        <div v-if="equipment == 'move'" class="computer_div_2">
          <a href="javascript:void(0)"
            ><button @click="jump('Rule1')" class="deta_button_3">
              立即預約箍牙諮詢
            </button></a
          ><br />
        </div> -->
      </div>
    </div>
    <div class="container-xl">
      <h2 class="service3_h2">
        2 種免費諮詢方式 <br />
        無壓力開始箍牙
      </h2>
      <!-- <div class="advisory" v-if="equipment == 'pc'">
        <div v-for="(item, index) in box2" :key="index">
          <div
            :style="`background-image: url('${item.img}') `"
            class="box3"
            :class="{
              'box2-hover': hoveredIndex2 === index,
              'box2-shrink': hoveredIndex2 !== null && hoveredIndex2 !== index,
            }"
            @mouseover="showOverlay2(index)"
            @mouseleave="hideOverlay2"
            @click="btnjump(item.url, 'aligner_1', 0)"
          >
            <h2 class="title" v-if="hoveredIndex2 !== index">
              {{ item.title }}
            </h2>
            <div class="box_text3" :class="{ visible: item.isOverlayVisible }">
              <h2 class="title">{{ item.title }}</h2>
              <h4 class="pp">{{ item.pp }}</h4>
              <p class="pp2" v-html="item.pp2"></p>
              <button class="box_btn">{{ item.button }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'move'">
        <div class="box2" v-for="(item, index) in box2" :key="index">
          <img class="box_img2" :src="item.img_move" alt="" />
          <div class="box_text2" @click="btnjump(item.url, 'aligner_1', 1)">
            <h2>{{ item.title }}</h2>
            <h4>{{ item.pp }}</h4>
            <p v-html="item.pp2"></p>
            <button class="box_btn">{{ item.button }}</button>
          </div>
        </div>
      </div> -->
      <div class="advisory" v-if="equipment == 'pc'">
        <div v-for="(item, index) in box1" :key="index">
          <div
            :style="`background-image: url('${item.img}') `"
            class="box"
            :class="{
              'box-hover': hoveredIndex === index,
              'box-shrink': hoveredIndex !== null && hoveredIndex !== index,
            }"
            @mouseover="showOverlay(index)"
            @mouseleave="hideOverlay"
            @click="btnjump(item.url)"
          >
            <h2 class="title" v-if="hoveredIndex !== index">
              {{ item.title }}
            </h2>
            <div class="box_text" :class="{ visible: item.isOverlayVisible }">
              <h2 class="title">{{ item.title }}</h2>
              <h4 class="pp">{{ item.pp }}</h4>
              <p class="pp2">{{ item.pp2 }}</p>
              <button class="box_btn">{{ item.button }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'move'">
        <div class="box2" v-for="(item, index) in box1" :key="index">
          <img class="box_img2" :src="item.img" alt="" />
          <div class="box_text2" @click="btnjump(item.url)">
            <h2>{{ item.title }}</h2>
            <h4>{{ item.pp }}</h4>
            <p>{{ item.pp2 }}</p>
            <button class="box_btn">{{ item.button }}</button>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="container-xl shop" id="Rule1">
        <h2 class="shop_h2">線上預約箍牙諮詢即享優惠價</h2>
        <p class="shop_p">1. 選擇 be@me 門市</p>
        <div class="shop_div">
          <van-collapse
            aria-expanded="true"
            style="text-align: left"
            v-for="item in items"
            :key="item.id"
            v-model="activeNames"
            ref="open_me"
          >
            <van-collapse-item
              v-if="item.name_tc != '深圳'"
              :name="item.name_tc"
              :id="item.name_tc"
            >
              <template #title>
                <div class="name">{{ item.name_tc }}</div>
              </template>
              <div
                @click="selectClinic(clinic)"
                class="deta"
                v-for="clinic in item.clinics"
                :key="clinic.id"
                :class="cityData.id == clinic.id ? 'fengqi_2' : ''"
              >
                <div class="deta_div">
                  <img
                    :src="`${clinic.image}?x-oss-process=image/resize,w_500/format,webp`"
                    class="clinic-img"
                    alt=""
                  />
                </div>
                <div class="deta_div_2">
                  <h3 class="deta_h3">{{ clinic.shop_name_cn }}</h3>
                  <p class="deta_p">
                    <img src="@/img/Group7431.png" alt="" />{{
                      clinic.phone_cn
                    }}
                  </p>
                  <p class="deta_p">
                    <img src="@/img/Group7432.png" alt="" />{{
                      clinic.start_time_cn
                    }}-{{ clinic.end_time_cn }}
                  </p>
                  <p class="deta_p" v-if="clinic.address_cn != null">
                    <img src="@/img/button icon_1@2x1.png" alt="" />{{
                      clinic.address_cn
                    }}
                  </p>
                </div>
              </div>
            </van-collapse-item>
          </van-collapse>
          <div></div>
        </div>
      </div>
    </div>
    <div class="container-xl calendar_div">
      <div class="row">
        <p class="calendar_p">2. 選擇諮詢時間及日期</p>
        <div class="col-lg-6 calendar">
          <div class="pc">
            <van-calendar
              :poppable="false"
              confirm-text="Sure"
              color="#00E467"
              v-model="show"
              :default-date="new Date(this.date)"
              :max-date="maxDate"
              :formatter="formatter"
              @confirm="onConfirm"
              :show-confirm="false"
              :style="{ height: '520px' }"
              :show-title="false"
              @select="onSelect"
            />
          </div>
        </div>
        <div class="col-lg-6 choice">
          <div class="time-button" v-for="(value, index) in time" :key="index">
            <div v-if="value <= 0">
              <button class="list-item" style="background-color: #eee">
                {{ index }}
                <span class="list-item_span">(預約已滿)</span>
              </button>
            </div>
            <div v-else>
              <button
                @click="clickTime(index)"
                class="list-item"
                :style="start == index ? 'background-color:#00e567' : ''"
              >
                {{ index }}
              </button>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
    <div class="container-xl">
      <div class="row">
        <p class="calendar_p2">3. 填寫個人資料</p>
        <div class="col-lg-12 calendar">
          <div class="input">
            <div class="input_name">
              <span class="input_span">姓名</span
              ><el-input
                v-model="userName"
                placeholder="輸入你的姓名（身份證或護照姓名）"
              ></el-input>
            </div>
            <div class="input_name">
              <span class="input_span">性別</span>
              <van-radio-group
                style="margin-left: 5px"
                v-model="sex"
                direction="horizontal"
                checked-color="#00E467"
              >
                <van-radio name="男">男</van-radio>
                <van-radio name="女">女 </van-radio>
                <van-radio name="隱藏">隱藏</van-radio>
              </van-radio-group>
            </div>
            <div class="service_div">
              <div class="service">
                箍牙人士身份&nbsp;&nbsp;
                <span class="characteristic">(可多選)</span>
              </div>

              <van-checkbox-group
                v-model="customerService"
                direction="horizontal"
                checked-color="#00E467"
                @change="handleChange"
              >
                <van-checkbox name="1" :disabled="isFirstDisabled"
                  >初次箍牙</van-checkbox
                >
                <van-checkbox name="2" :disabled="isSecondDisabled"
                  >二次重箍</van-checkbox
                >
                <van-checkbox name="3">中/大學生</van-checkbox>
                <van-checkbox name="4">兒童（小學生）</van-checkbox>
                <van-checkbox name="5">準婚人士</van-checkbox>
              </van-checkbox-group>
            </div>
            <div class="input_name">
              <span class="input_span">服務類別</span>
              <van-radio-group
                style="margin-left: 5px"
                v-model="category"
                direction="horizontal"
                checked-color="#00E467"
              >
                <van-radio
                  name="19"
                  :disabled="disabledCategories.includes('19')"
                  >箍牙初步諮詢</van-radio
                >
                <van-radio name="6" :disabled="disabledCategories.includes('6')"
                  >領取牙套</van-radio
                >

                <van-radio
                  name="20"
                  :disabled="disabledCategories.includes('20')"
                  >固定器諮詢</van-radio
                >

                <van-radio
                  name="21"
                  :disabled="disabledCategories.includes('21')"
                  >現有客戶跟進</van-radio
                >
              </van-radio-group>
            </div>

            <div class="input_name">
              <span class="input_span input_span_2">電話號碼</span>
              <el-select v-model="value" placeholder="香港+852">
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
              <el-input v-model="Phone" placeholder="12345678"></el-input>
            </div>
            <div class="input_name">
              <span class="input_span">邀請碼</span>
              <el-input
                v-model="invitationCode"
                placeholder="請輸入邀請碼"
              ></el-input>
            </div>
            <div class="input_name">
              <span class="input_span">電郵</span
              ><el-input
                v-model="mail"
                placeholder="example@mybeame.com"
              ></el-input>
            </div>

            <p class="hint">
              請填寫你的電話號碼和郵件，以便我們與你聯絡。這對於你的治療計劃、預約及其它健康相關疑問，甚至任何緊急更新都至關重要。
            </p>

            <button
              class="input_button"
              style="cursor: pointer"
              @click="kap1()"
              :loading="loading"
            >
              確認預約出席
            </button>
            <div class="subscription">
              <van-checkbox
                label-disabled
                v-model="checked"
                shape="square"
                checked-color="#00E467"
                >我已年滿 18 歲並同意
                <span @click="dialogVisible = true" class="subscription_span">
                  條款及細則
                </span>
                和
                <span @click="dialogVisible2 = true" class="subscription_span">
                  私隱政策</span
                >.</van-checkbox
              >
            </div>
            <el-dialog title="Terms & Conditions" :visible.sync="dialogVisible">
              <ConsentAgreementEn></ConsentAgreementEn>

              <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="dialogVisible = false"
                  >確 定</el-button
                >
              </span>
            </el-dialog>
            <el-dialog title="" :visible.sync="dialogVisible2">
              <PrivacyPolicyEn></PrivacyPolicyEn>

              <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="dialogVisible2 = false"
                  >確 定</el-button
                >
              </span>
            </el-dialog>
          </div>
        </div>
      </div>
    </div>
    <div class="container-xl">
      <div class="advantage_div">
        <h2 class="process_h2">開始透明牙箍全過程</h2>
        <h3 class="process_h3">5 步取得首個透明牙箍</h3>
        <div v-if="equipment == 'pc'" class="row advantage_div_2">
          <div class="col-md-1"></div>
          <div class="col-md-2">
            <img
              class="advantage_img advantage_img4"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_14.png'
              "
              alt=" Beame 箍牙第 1 步，透過網上或 WhatsApp 預約門市諮詢。"
            />
            <h3 class="advantage_h3">網上預約</h3>
            <p class="advantage_p">
              網上或 Whatsapp 客服<br />
              預約門市諮詢
            </p>
          </div>
          <div class="col-md-2">
            <img
              class="advantage_img advantage_img4"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_10.png'
              "
              alt="出席箍牙諮詢，Beame 微笑顧問初步確認是否適合箍牙。"
            />
            <h3 class="advantage_h3">準時到達門市</h3>
            <p class="advantage_p">專人解答疑問及報價</p>
          </div>
          <div class="col-md-2">
            <img
              class="advantage_img advantage_img4"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_11.png'
              "
              alt="箍牙先到診所進行 3D 掃描，3D 牙模用以設計箍牙方案。"
            />
            <h3 class="advantage_h3">診所 3D 掃描</h3>
            <p class="advantage_p">由牙醫直接確認牙齒狀況</p>
          </div>
          <div class="col-md-2">
            <img
              class="advantage_img advantage_img4"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_12.png'
              "
              alt="由牙醫設計箍牙方案後，確認箍牙方案，再由 Beame 實際製作透明牙箍。"
            />
            <h3 class="advantage_h3">確認箍牙方案</h3>
            <p class="advantage_p">等待透明牙箍製作</p>
          </div>
          <div class="col-md-2">
            <img
              class="advantage_img advantage_img4"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_13.png'
              "
              alt="到 Beame 門市領取牙箍，Beame 手把手教佩戴牙箍。"
            />
            <h3 class="advantage_h3">領取透明牙箍</h3>
            <p class="advantage_p">到預約門市領取</p>
          </div>
          <div class="col-md-1"></div>
        </div>
        <div v-if="equipment == 'move'" class="advantage_div_3">
          <div class="advantage_width">
            <div class="col-lg-2">
              <img
                class="advantage_img advantage_margin"
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_14.png'
                "
                alt="Beame 箍牙第 1 步，透過網上或 WhatsApp 預約門市諮詢。"
              />
            </div>
            <div class="col-lg-2">
              <img
                class="advantage_img advantage_margin"
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_10.png'
                "
                alt="出席箍牙諮詢，Beame 微笑顧問初步確認是否適合箍牙。"
              />
            </div>
            <div class="col-lg-2">
              <img
                class="advantage_img advantage_margin"
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_11.png'
                "
                alt="箍牙先到診所進行 3D 掃描，3D 牙模用以設計箍牙方案。"
              />
            </div>
            <div class="col-lg-2">
              <img
                class="advantage_img advantage_margin"
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_12.png'
                "
                alt="由牙醫設計箍牙方案後，確認箍牙方案，再由 Beame 實際製作透明牙箍。"
              />
            </div>
            <div class="col-lg-2">
              <img
                class="advantage_img advantage_margin"
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_13.png'
                "
                alt="到 Beame 門市領取牙箍，Beame 手把手教佩戴牙箍。"
              />
            </div>
          </div>
          <div>
            <div class="col-lg-2 step">
              <h3 class="advantage_h3">預約門市諮詢</h3>
              <p class="advantage_p">網上或 WhatsApp 預約</p>
              <p class="advantage_p3">↓</p>
            </div>
            <div class="col-lg-2 step">
              <h3 class="advantage_h3">出席箍牙諮詢</h3>
              <p class="advantage_p">1 對 1 專人解答疑問</p>
              <p class="advantage_p3">↓</p>
            </div>
            <div class="col-lg-2 step">
              <h3 class="advantage_h3">診所 3D 掃描</h3>
              <p class="advantage_p">由牙醫直接確認牙齒狀況</p>
              <p class="advantage_p3">↓</p>
            </div>
            <div class="col-lg-2 step">
              <h3 class="advantage_h3">確認箍牙方案</h3>
              <p class="advantage_p">等待透明牙箍製作</p>
              <p class="advantage_p3">↓</p>
            </div>
            <div class="col-lg-2 step">
              <h3 class="advantage_h3">領取透明牙箍及禮品</h3>
              <p class="advantage_p">到預約門市領取</p>
              <p class="advantage_p3" style="color: #fff">↓</p>
            </div>
          </div>
        </div>
        <button @click="jump('Rule')" class="scheme_button">
          立即預約箍牙諮詢
        </button>
      </div>
    </div>
    <div class="container-xl">
      <div class="feedback-contrast">
        <h2
          class="feedback-h2"
          style="margin-bottom: 15px"
          v-if="equipment == 'pc'"
        >
          <span style="font-family: 'Comfortaa-Bold'">be@me</span>
          牙科品牌全港門市支援你的笑容
        </h2>
        <h2
          class="feedback-h2"
          style="margin-bottom: 15px"
          v-if="equipment == 'move'"
        >
          <span style="font-family: 'Comfortaa-Bold'">be@me</span> 牙科品牌
          <br />
          全港門市支援你的笑容
        </h2>
        <div class="feedback" v-if="equipment == 'pc'">
          <div>
            <el-carousel
              ref="carousel1"
              arrow="never"
              indicator-position="outside"
              height="400px"
            >
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">
                      箍牙口腔評估 <br /><span class="feedback-name-span"
                        >完成問卷享門診免費掃描</span
                      >
                    </h3>
                    <p class="feedback-time">
                      由團隊依照問卷結果，建議最合適你的箍牙方式。最終決定箍牙，免除門診
                      3D 掃描費用，再鎖定 $6,705 優惠。
                    </p>

                    <button class="feedback-button" @click="Jump('/test1', 1)">
                      開始箍牙評估
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon1"
                      src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-68.png?x-oss-process=image/resize,w_800/format,webp"
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">
                      體驗空間 <br /><span class="feedback-name-span"
                        >免費 3D 掃描</span
                      >
                    </h3>
                    <p class="feedback-time">
                      了解牙齒狀況，準確為牙齒建模，牙醫直接製作箍牙計劃。
                    </p>

                    <button
                      class="feedback-button"
                      @click="Jump('/experience-room')"
                    >
                      瞭解更多
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon1"
                      v-lazy="
                        'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-18.png?x-oss-process=image/resize,w_800/format,webp'
                      "
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">
                      透明牙箍 <br />學生箍牙優惠減<span style="color: #00e467"
                        >$500</span
                      >
                    </h3>
                    <p class="feedback-time">
                      出席門市箍牙諮詢並出示本人有效學生証，箍牙費用額外減
                      $500。
                    </p>

                    <button
                      class="feedback-button"
                      @click="Jump('/beame-student-discount')"
                    >
                      立即預約
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon"
                      v-lazy="
                        'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-7.png?x-oss-process=image/resize,w_800/format,webp'
                      "
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">
                      <span style="font-family: 'Comfortaa-Bold'"
                        >be@me Care+</span
                      >
                      <br />箍牙終身笑容保養
                    </h3>
                    <p class="feedback-time">
                      <span style="font-family: 'Comfortaa-Bold'">be@me</span>
                      箍牙依照指示佩戴固定器，期間發生任何牙齒走位，可免費重啟箍牙。
                    </p>

                    <button class="feedback-button" @click="Jump('/retainer')">
                      立即預約
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon"
                      v-lazy="
                        'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-8.png?x-oss-process=image/resize,w_800/format,webp'
                      "
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
            </el-carousel>
          </div>
        </div>
        <div class="feedback" v-if="equipment == 'move'">
          <div>
            <el-carousel
              ref="carousel1"
              arrow="never"
              indicator-position="outside"
              height="400px"
            >
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">箍牙口腔評估</h3>
                    <h4 class="feedback-h4">完成問卷享門診免費掃描</h4>
                    <p class="feedback-time">
                      由團隊依照問卷結果，建議最合適你的箍牙方式。最終決定箍牙，免除門診
                      3D 掃描費用，再鎖定 $6,705 優惠。
                    </p>

                    <button class="feedback-button" @click="Jump('/test1')">
                      開始箍牙評估
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon feedback-width-2"
                      src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-68.png?x-oss-process=image/resize,w_800/format,webp"
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">體驗空間</h3>
                    <h4 class="feedback-h4">免費 3D 掃描</h4>
                    <p class="feedback-time">
                      了解牙齒狀況，準確為牙齒建模，牙醫直接製作箍牙計劃。
                    </p>

                    <button
                      class="feedback-button"
                      @click="Jump('/experience-room')"
                    >
                      瞭解更多
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon feedback-width-2"
                      v-lazy="
                        'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-18.png?x-oss-process=image/resize,w_800/format,webp'
                      "
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">透明牙箍</h3>
                    <h4 class="">
                      學生箍牙優惠減<span style="color: #00e467">$500</span>
                    </h4>
                    <p class="feedback-time">
                      出席門市箍牙諮詢並出示本人有效學生証，箍牙費用額外減
                      $500。
                    </p>

                    <button
                      class="feedback-button"
                      @click="Jump('/beame-student-discount')"
                    >
                      立即預約
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon"
                      v-lazy="
                        'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-7.png?x-oss-process=image/resize,w_800/format,webp'
                      "
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
              <el-carousel-item>
                <div class="feedback-div">
                  <div class="feedback-left">
                    <h3 class="feedback-name">
                      <span style="font-family: 'Comfortaa-Bold'"
                        >be@me Care+</span
                      >
                    </h3>
                    <h4 class="">箍牙終身笑容保養</h4>
                    <p class="feedback-time">
                      <span style="font-family: 'Comfortaa-Bold'">be@me</span>
                      箍牙依照指示佩戴固定器，期間發生任何牙齒走位，可免費重啟箍牙。
                    </p>

                    <button class="feedback-button" @click="Jump('/retainer')">
                      立即預約
                    </button>
                  </div>
                  <div class="feedback-right">
                    <img
                      class="feedback-icon feedback-width"
                      v-lazy="
                        'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-8.png?x-oss-process=image/resize,w_800/format,webp'
                      "
                      alt=""
                    />
                  </div>
                </div>
              </el-carousel-item>
            </el-carousel>
          </div>
        </div>
      </div>
    </div>
    <div class="container-xl">
      <div class="free">
        <h2 class="free-title">香港牙醫提供箍牙支援</h2>
        <p class="free-tags">全新體驗空間免費 3D 掃描</p>
        <div class="free-div">
          由香港專業牙醫團隊主理，在港九的 be@me 體驗空間預約直接進行 3D 掃描。
        </div>
        <div class="container-xl">
          <div class="free-container">
            <div class="free-content">
              <img
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-3.png'
                "
                alt=""
              />
              <h3>高精度掃描</h3>
              <p>
                先進的數位掃描技術，快速舒適地為您的牙齒和口腔結構建立高精度數位模型
                。   
              </p>
            </div>
            <div class="free-content">
              <img
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-4.png'
                "
                alt=""
              />
              <h3>牙醫專業評估</h3>
              <p>
                由牙醫親自主理，透過詳細數據，牙醫能更全面、精準地評估牙齒狀況，並提供初步矯正可行性分析與專業建議。
              </p>
            </div>
            <div class="free-content">
              <img
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-6.png'
                "
                alt=""
              />
              <h3>直接解答疑問</h3>
              <p>
                體驗空間作為你與專業牙醫連結的橋樑，即場 1 對 1 諮詢，了解 be@me
                箍牙細節。
              </p>
            </div>
            <div class="free-content">
              <img
                v-lazy="
                  'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-5.png'
                "
                alt=""
              />
              <h3>完全免費</h3>
              <p>
                掃描服務完全免費，不附帶任何隱藏費用或強制性消費。即使掃描後不參與箍牙，亦無需收費。
              </p>
            </div>
          </div>
          <div class="waist">
            <a href="javascript:void(0)">
              <button @click="Jump('/experience-room')" class="waist_button">
                預約體驗空間
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="container-xl">
      <h2 class="process_h2_1">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />4 大優勢箍牙推薦 Beame
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="process_h3_1">TUV nord 南德認證檢測透明牙箍</h3>
      <div class="promotion">
        <div class="promotion_left">
          <div class="promotion_step">
            <div class="promotion_left_div">
              <img
                class="promotion_left_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_34.png"
                alt=""
              />
            </div>
            <div>
              <h3 class="promotion_left_h3">24 小時舒適佩戴</h3>
              <p class="promotion_left_p">貼合牙齦邊緣設計</p>
            </div>
          </div>
          <div class="promotion_step">
            <div class="promotion_left_div">
              <img
                class="promotion_left_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_35.png"
                alt=""
              />
            </div>
            <div>
              <h3 class="promotion_left_h3">不易染色</h3>
              <p class="promotion_left_p">抗染色效能提升 30%</p>
            </div>
          </div>
          <div class="promotion_step">
            <div class="promotion_left_div">
              <img
                class="promotion_left_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_36.png"
                alt=""
              />
            </div>
            <div>
              <h3 class="promotion_left_h3">持久力</h3>
              <p class="promotion_left_p">持續提供精準箍牙力度</p>
            </div>
          </div>
          <div class="promotion_step">
            <div class="promotion_left_div">
              <img
                class="promotion_left_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_37.png"
                alt=""
              />
            </div>
            <div>
              <h3 class="promotion_left_h3">不易變形 摘帶安心</h3>
              <p class="promotion_left_p">材質綜合抗撕裂性提升 30%</p>
            </div>
          </div>
        </div>
        <div class="promotion_div">
          <img
            class="promotion_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_33.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="Beame 透明牙箍 24 小時舒適佩戴，完全透明不易染色，持續提供準確箍牙正度。"
          />
        </div>
      </div>
    </div>

    <div class="container-xl advantage_content" v-if="equipment == 'pc'">
      <h2 class="advantage_h2">Beame 透明牙箍有效改善以下牙齒問題</h2>
      <h2 v-if="equipment == 'move'" class="advantage_h2">
        Beame 透明牙箍 <br />有效改善以下牙齒問題
      </h2>
      <div class="row advantage">
        <div class="col-md-4">
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_38.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="牙齒錯咬是指上下牙齒在咬合時未能正常對齊，導致咬合關係不正確。"
          />
          <p class="advantage_p2">牙齒錯咬</p>
        </div>
        <div class="col-md-4">
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_39.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="門牙突出是指上前牙（通常是中切牙）相對於下前牙的位置過於向前，形成明顯的突出現象。這種情況通常被稱為「前牙突」或「上前牙突出」。"
          />
          <p class="advantage_p2">門牙突出</p>
        </div>
        <div class="col-md-4">
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_40.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="齒列擁擠是指牙齒在口腔中排列過於密集，導致牙齒無法正常對齊或排列整齊的情況。"
          />
          <p class="advantage_p2">齒列擁擠</p>
        </div>
      </div>
      <div class="row advantage">
        <div class="col-md-4">
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_41.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="亂齒是指牙齒排列不整齊的情況，通常包括牙齒的傾斜、重疊或分散。"
          />
          <p class="advantage_p2">亂齒</p>
        </div>
        <div class="col-md-4">
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_42.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="地包天是一種牙齒排列不正的情況，通常指下顎的牙齒在咬合時位於上顎牙齒的前面。這種情況也稱為「反咬合」。"
          />
          <p class="advantage_p2">地包天</p>
        </div>
        <div class="col-md-4">
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_43.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="牙縫過大是指牙齒之間的間隙過於寬廣，這種情況可能會讓人感到不適或影響美觀。"
          />
          <p class="advantage_p2">牙縫過大</p>
        </div>
      </div>
    </div>
    <div class="container-xl advantage_content" v-if="equipment == 'move'">
      <h2 class="advantage_h2">Beame 透明牙箍 <br />有效改善以下牙齒問題</h2>
      <div class="advantage">
        <div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_38.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="牙齒錯咬是指上下牙齒在咬合時未能正常對齊，導致咬合關係不正確。"
          />
          <p class="advantage_p2">牙齒錯咬</p>
        </div>
        <div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_39.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="門牙突出是指上前牙（通常是中切牙）相對於下前牙的位置過於向前，形成明顯的突出現象。這種情況通常被稱為「前牙突」或「上前牙突出」。"
          />
          <p class="advantage_p2">門牙突出</p>
        </div>
      </div>
      <div class="advantage">
        <div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_40.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="齒列擁擠是指牙齒在口腔中排列過於密集，導致牙齒無法正常對齊或排列整齊的情況。"
          />
          <p class="advantage_p2">齒列擁擠</p>
        </div>
        <div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_41.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="亂齒是指牙齒排列不整齊的情況，通常包括牙齒的傾斜、重疊或分散。"
          />
          <p class="advantage_p2">亂齒</p>
        </div>
      </div>

      <div class="advantage">
        <div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_42.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="地包天是一種牙齒排列不正的情況，通常指下顎的牙齒在咬合時位於上顎牙齒的前面。這種情況也稱為「反咬合」。"
          />
          <p class="advantage_p2">地包天</p>
        </div>
        <div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_43.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="牙縫過大是指牙齒之間的間隙過於寬廣，這種情況可能會讓人感到不適或影響美觀。"
          />
          <p class="advantage_p2">牙縫過大</p>
        </div>
      </div>
    </div>
    <!-- <div class="container-xl">
      <h2 class="service3_h2">
        3 種免費諮詢方式 <br />
        無壓力開始箍牙
      </h2>
      <div class="advisory" v-if="equipment == 'pc'">
        <div v-for="(item, index) in box2" :key="index">
          <div
            :style="`background-image: url('${item.img}') `"
            class="box3"
            :class="{
              'box2-hover': hoveredIndex2 === index,
              'box2-shrink': hoveredIndex2 !== null && hoveredIndex2 !== index,
            }"
            @mouseover="showOverlay2(index)"
            @mouseleave="hideOverlay2"
            @click="btnjump(item.url, 'aligner_2', 0)"
          >
            <h2 class="title" v-if="hoveredIndex2 !== index">
              {{ item.title }}
            </h2>
            <div class="box_text3" :class="{ visible: item.isOverlayVisible }">
              <h2 class="title">{{ item.title }}</h2>
              <h4 class="pp">{{ item.pp }}</h4>
              <p class="pp2" v-html="item.pp2"></p>
              <button class="box_btn">{{ item.button }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'move'">
        <div class="box2" v-for="(item, index) in box2" :key="index">
          <img class="box_img2" :src="item.img_move" alt="" />
          <div class="box_text2" @click="btnjump(item.url, 'aligner_2', 1)">
            <h2>{{ item.title }}</h2>
            <h4>{{ item.pp }}</h4>
            <p v-html="item.pp2"></p>
            <button class="box_btn">{{ item.button }}</button>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'pc'">
        <div v-for="(item, index) in box1" :key="index">
          <div
            :style="`background-image: url('${item.img}') `"
            class="box"
            :class="{
              'box-hover': hoveredIndex === index,
              'box-shrink': hoveredIndex !== null && hoveredIndex !== index,
            }"
            @mouseover="showOverlay(index)"
            @mouseleave="hideOverlay"
            @click="btnjump(item.url)"
          >
            <h2 class="title" v-if="hoveredIndex !== index">
              {{ item.title }}
            </h2>
            <div class="box_text" :class="{ visible: item.isOverlayVisible }">
              <h2 class="title">{{ item.title }}</h2>
              <h4 class="pp">{{ item.pp }}</h4>
              <p class="pp2">{{ item.pp2 }}</p>
              <button class="box_btn">{{ item.button }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'move'">
        <div class="box2" v-for="(item, index) in box1" :key="index">
          <img class="box_img2" :src="item.img" alt="" />
          <div class="box_text2" @click="btnjump(item.url)">
            <h2>{{ item.title }}</h2>
            <h4>{{ item.pp }}</h4>
            <p>{{ item.pp2 }}</p>
            <button class="box_btn">{{ item.button }}</button>
          </div>
        </div>
      </div>
    </div> -->
    <!-- 横幅文字无限滚动组件 -->
    <rolling>
      <template v-slot:one>
        <ul>
          <li v-for="(item, index) in list" :key="index">
            <img class="rolling_img" :src="item.img" alt="" /> {{ item.name }}
          </li>
        </ul>
        <ul>
          <li v-for="(item, index) in list" :key="index">
            <img class="rolling_img" :src="item.img" alt="" /> {{ item.name }}
          </li>
        </ul>
      </template>
    </rolling>
    <div class="container-xl customers" v-if="equipment == 'pc'">
      <h2 class="advantage_h2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />真實 Beame 箍牙成功例子
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <el-carousel
        height="300px"
        ref="carousel1"
        arrow="always"
        :autoplay="false"
        indicator-position="outside"
      >
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <!-- <img
                style="border-radius: 20px 0 0 20px"
                class="customers_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_39.png"
                alt=""
              /> -->
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_6.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_7.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
            </div>
            <div class="compare_2">
              <!-- <img
                class="customers_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_41.png"
                alt=""
              /> -->
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_8.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_9.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
            </div>
            <div class="compare_2">
              <!-- <img
                class="customers_img"
                src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_40.png"
                alt=""
              /> -->
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_10.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_11.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
            </div>
          </div>
        </el-carousel-item>
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_12.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_13.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
            </div>
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_14.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_15.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
            </div>
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_16.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_17.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
            </div>
          </div>
        </el-carousel-item>
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_18.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_19.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
            </div>
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_20.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_21.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
            </div>
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_22.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
              <div class="compare_div_right">
                <img
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_23.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
                <!-- <button class="compare_button_1">Before</button> -->
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
      <div class="waist">
        <a href="javascript:void(0)">
          <button @click="jump('Rule')" class="waist_button">
            立即預約箍牙諮詢
          </button>
        </a>
        <!-- <p class="advantage_p2">*Individual results may vary</p> -->
      </div>
    </div>
    <div class="container-xl customers" v-if="equipment == 'move'">
      <h2 class="advantage_h2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />真實 Beame 箍牙成功例子
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <el-carousel
        height="300px"
        ref="carousel1"
        arrow="never"
        indicator-position="outside"
      >
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  style="border-radius: 20px 0 0 20px"
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_6.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  style="border-radius: 0px 20px 20px 0px"
                  class="customers_img"
                  src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_7.png?x-oss-process=image/resize,w_800/format,webp"
                  alt=""
                />
              </div>
            </div>
          </div>
        </el-carousel-item>
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  style="border-radius: 20px 0 0 20px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_8.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  style="border-radius: 0px 20px 20px 0px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_9.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
            </div>
          </div>
        </el-carousel-item>
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  style="border-radius: 20px 0 0 20px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_10.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  style="border-radius: 0px 20px 20px 0px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_11.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
            </div>
          </div>
        </el-carousel-item>
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  style="border-radius: 20px 0 0 20px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_12.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  style="border-radius: 0px 20px 20px 0px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_13.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
            </div>
          </div>
        </el-carousel-item>
        <el-carousel-item>
          <div class="advantage_2">
            <div class="compare_2">
              <div class="compare_div_left">
                <img
                  style="border-radius: 20px 0 0 20px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_14.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
              <div class="compare_div_right">
                <img
                  style="border-radius: 0px 20px 20px 0px"
                  class="customers_img"
                  v-lazy="
                    'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/JPN_international_15.png?x-oss-process=image/resize,w_800/format,webp'
                  "
                  alt=""
                />
              </div>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
      <div class="waist">
        <a href="javascript:void(0)">
          <button @click="jump('Rule')" class="waist_button">
            立即預約箍牙諮詢
          </button>
        </a>
        <!-- <p class="advantage_p2">*Individual results may vary</p> -->
      </div>
    </div>
    <div class="container-xl scheme">
      <h2 class="Price_h2_3">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />2 大透明牙箍價錢矯正方案<img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="Price_h3_2">靈活解決牙齒走位</h3>
      <div class="container">
        <div class="slide">
          <table border="1" bordercolor="#000" width="100%">
            <tbody>
              <tr>
                <th class="gradient1" style="border-right: 1px solid #fff"></th>
                <th class="gradient2" style="">
                  be@me <br />
                  Lite
                </th>
                <th
                  class="gradient3"
                  style="
                    border-right: 1px solid #fff;
                    border-left: 1px solid #fff;
                  "
                >
                  be@me <br />
                  Clear
                </th>
                <th class="gradient4" style="border-left: 1px solid #fff">
                  be@me <br />
                  PRO
                </th>
                <th class="gradient5" style="border-radius: 0 25px 0 0">
                  be@me <br />
                  Elite
                </th>
              </tr>
              <tr>
                <td class="table_td">適用牙齒</td>
                <td class="Pricebackground1">適合微矯正<br />單邊牙箍</td>
                <td class="Pricebackground2">適合改善前牙</td>
                <td class="Pricebackground3">適合全口牙齒</td>
                <td class="Pricebackground4">適合全口牙齒</td>
              </tr>
              <tr>
                <td class="table_td">複雜程度</td>
                <td class="Pricebackground1">
                  輕微走位<br />
                  二次矯正
                </td>
                <td class="Pricebackground2">
                  輕度至中度<br />
                  牙齒問題
                </td>
                <td class="Pricebackground3">複雜牙齒問題</td>
                <td class="Pricebackground4">更複雜牙齒問題</td>
              </tr>
              <tr>
                <td class="table_td">門市諮詢及支援</td>
                <td class="Pricebackground1">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground2">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground3">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="table_td Pricebackground4">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
              </tr>
              <tr>
                <td class="table_td">診所 3D 掃描及分析</td>
                <td class="Pricebackground1">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground2">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground3">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground4">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
              </tr>
              <tr>
                <td class="table_td">牙醫檢查及跟進</td>
                <td class="Pricebackground1">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground2">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground3">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground4">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
              </tr>
              <tr>
                <td
                  class="table_td"
                  style="background-color: #ebfbf5; font-weight: 600"
                >
                  網上預約優惠價
                </td>
                <td class="Pricebackground1" style="font-weight: 600">
                  $ 12,980
                </td>
                <td class="Pricebackground2" style="font-weight: 600">
                  $ 14,980
                </td>
                <td class="Pricebackground3" style="font-weight: 600">
                  $ 28,800
                </td>
                <td class="table_td Pricebackground4" style="font-weight: 600">
                  $ 35,000
                </td>
              </tr>
              <tr>
                <td class="table_td" style="border-bottom: 3px solid #94e3b8">
                  原價
                </td>
                <td
                  class="Pricebackground1"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  $ 14,800
                </td>
                <td
                  class="Pricebackground2"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  $ 16,800
                </td>
                <td
                  class="Pricebackground3"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  $ 30,620
                </td>
                <td
                  class="Pricebackground4"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  $ 36,820
                </td>
              </tr>

              <tr>
                <td class="table_td">牙套數量</td>
                <td class="Pricebackground1">10 副或以下</td>
                <td class="Pricebackground2">20 副或以下</td>
                <td class="Pricebackground3">40 副或以下</td>
                <td class="Pricebackground4">40 副以上</td>
              </tr>
              <tr>
                <td class="table_td">全程牙醫跟進</td>
                <td class="Pricebackground1">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground2">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground3">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground4">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
              </tr>
              <tr>
                <td class="table_td">X 光</td>
                <td class="Pricebackground1">\</td>
                <td class="Pricebackground2">按狀況需要</td>
                <td class="Pricebackground3">已包括</td>
                <td class="Pricebackground4">已包括</td>
              </tr>
              <tr>
                <td class="table_td">牙齒附件</td>
                <td class="Pricebackground1">\</td>
                <td class="Pricebackground2">\</td>
                <td class="Pricebackground3">已包括</td>
                <td class="Pricebackground4">香港/深圳</td>
              </tr>
              <tr>
                <td class="table_td">IPR 磨牙</td>
                <td class="Pricebackground1">\</td>
                <td class="Pricebackground2">\</td>
                <td class="Pricebackground3">已包括</td>
                <td class="Pricebackground4">香港/深圳</td>
              </tr>
              <tr>
                <td class="table_td" style="border-bottom: 3px solid #94e3b8">
                  拔牙/骨釘
                </td>
                <td
                  class="Pricebackground1"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  \
                </td>
                <td
                  class="Pricebackground2"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  \
                </td>
                <td
                  class="Pricebackground3"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  按牙齒狀況決定
                </td>
                <td
                  class="table_td Pricebackground4"
                  style="border-bottom: 4px solid #94e3b8"
                >
                  按牙齒狀況決定
                </td>
              </tr>
              <tr>
                <td class="table_td">
                  美白套裝<br /><span style="font-size: 12px"
                    >(價值 $4385)</span
                  >
                </td>
                <td class="Pricebackground1">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground2">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground3">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground4">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
              </tr>
              <tr>
                <td class="table_td">
                  全年洗牙保障 <br /><span style="font-size: 12px">
                    (價值 ¥499)</span
                  >
                </td>
                <td class="Pricebackground1"></td>
                <td class="Pricebackground2">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground3">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
                <td class="Pricebackground4">
                  <i class="el-icon-success" style="color: #14c923"></i>
                </td>
              </tr>
              <tr>
                <td class="table_td" style="border-radius: 0px 0px 0px 25px">
                  額外優惠 <br />
                  <span class="td-span">（學生/準婚/二次/轉會）</span>
                </td>
                <td class="Pricebackground1" style="">不適用</td>
                <td class="Pricebackground2">最大 $500 折扣</td>
                <td class="Pricebackground3">最大 $500 折扣</td>
                <td
                  class="table_td Pricebackground4"
                  style="border-radius: 0px 0px 25px 0px"
                >
                  最大 $500 折扣
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button @click="jump('Rule')" class="scheme_button">
          立即預約箍牙諮詢
        </button>
      </div>
    </div>
    <div class="container-xl video">
      <h2 class="video_h2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />大人都可以低調箍牙<img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <div class="video_div">
        <iframe
          width="90%"
          height="100%"
          src="https://www.youtube.com/embed/U6HRwoE-fnQ"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
    </div>
    <div v-if="equipment == 'pc'" class="container-xl Consultant">
      <h2 class="process_h2_2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />網上預約門市箍牙諮詢<img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="process_h3_2">1 對 1 諮詢微笑顧問環節</h3>
      <div class="row Consultant_div">
        <div class="col-md-4">
          <img
            class="Consultant_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_44.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="Beame 門市可以完成初步箍牙評估，了解是否適合使用 Beame 透明牙箍箍牙。"
          />
          <h3 class="Consultant_h3">初步箍牙評估</h3>
        </div>
        <div class="col-md-4">
          <img
            class="Consultant_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_45.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="Beame 門市箍牙諮詢，由微笑顧問解答箍牙方案疑問。"
          />
          <h3 class="Consultant_h3">解答箍牙方案疑問</h3>
        </div>
        <div class="col-md-4">
          <img
            class="Consultant_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_46.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="Beame 門市箍牙諮詢，諮詢費用全免，不參與箍牙最終不會產生收費。"
          />
          <h3 class="Consultant_h3">諮詢費用全免</h3>
        </div>
      </div>
      <button @click="jump('Rule')" class="scheme_button">
        立即預約箍牙諮詢
      </button>
    </div>
    <div v-if="equipment == 'move'" class="container-xl Consultant">
      <h2 class="process_h2_2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />網上預約門市箍牙諮詢<img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="process_h3_2">1 對 1 諮詢微笑顧問環節</h3>
      <div class="Consultant_div">
        <div class="Consultant_div2">
          <img
            class="Consultant_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_44.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="Beame 門市可以完成初步箍牙評估，了解是否適合使用 Beame 透明牙箍箍牙。"
          />
          <h3 class="Consultant_h3">初步箍牙評估</h3>
        </div>
        <div class="Consultant_div3">
          <div>
            <img
              class="Consultant_img"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_45.png?x-oss-process=image/resize,w_800/format,webp'
              "
              alt="Beame 門市箍牙諮詢，由微笑顧問解答箍牙方案疑問。"
            />
            <h3 class="Consultant_h3">解答箍牙方案疑問</h3>
          </div>
          <div class="">
            <img
              class="Consultant_img"
              v-lazy="
                'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_46.png?x-oss-process=image/resize,w_800/format,webp'
              "
              alt="Beame 門市箍牙諮詢，諮詢費用全免，不參與箍牙最終不會產生收費。"
            />
            <h3 class="Consultant_h3">諮詢費用全免</h3>
          </div>
        </div>
      </div>
      <button @click="jump('Rule')" class="scheme_button">
        立即預約箍牙諮詢
      </button>
    </div>

    <div style="position: relative" class="CaseStudy_div">
      <div class="CaseStudy">
        <h2 class="Price_h2_2">
          <span style="color: #25ce7b; font-family: GenSenMaruGothicTW-Bold"
            >全程牙醫跟進</span
          >箍牙個案
        </h2>
        <h3 class="Price_h3_1">彈性牙醫會面選擇</h3>

        <h3 class="Price_h3">專業評估及準備</h3>
        <p class="Price_p" v-if="equipment == 'pc'">
          由牙醫為複雜牙齒狀況於開始箍牙前磨牙、 拔牙、添加牙齒附件。
        </p>
        <p class="Price_p" v-if="equipment == 'move'">
          由牙醫為複雜牙齒狀況於開始箍牙前磨牙、<br />
          拔牙、添加牙齒附件。
        </p>
        <h3 class="Price_h3">不綑綁面診次數</h3>
        <p class="Price_p">
          由 0 至無限次，按客人預算調整覆診次數，降低箍牙門檻。
        </p>
        <h3 class="Price_h3">更豐富牙醫選擇</h3>
        <p class="Price_p">自選約見香港合作牙醫或深圳自有光旗艦門診牙醫。</p>
      </div>

      <img
        v-if="equipment == 'pc'"
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_47.png?x-oss-process=image/resize,w_1500/format,webp'
        "
        alt="Beame 透明牙箍由牙醫設計及跟進，在箍牙途中會由牙醫持續監察箍牙進度，客人亦可預約牙醫面診。"
      />
      <img
        v-if="equipment == 'move'"
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_50.png?x-oss-process=image/resize,w_800/format,webp'
        "
        alt="Beame 透明牙箍由牙醫設計及跟進，在箍牙途中會由牙醫持續監察箍牙進度，客人亦可預約牙醫面診。"
      />
    </div>
    <!-- <div class="container-xl scheme">
      <h2 class="Price_h2_3">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />牙醫服務收費價目表<img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="Price_h3_2">牙醫服務收費價目表</h3>
      <div class="container">
        <table border="1" bordercolor="#000" width="100%">
          <tr>
            <th
              style="
                border-radius: 40px 0 0 0;
                border-right: 1px solid #fff;
                width: 50%;
              "
            >
              項目
            </th>
            <th style="border-radius: 0 40px 0 0; border-left: 1px solid #fff">
              價錢
            </th>
          </tr>
          <tr>
            <td class="table_td">自有光門診 3D 掃描</td>
            <td class="table_td">免費</td>
          </tr>
          <tr>
            <td class="table_td">追蹤箍牙進度</td>
            <td>免費</td>
          </tr>
          <tr>
            <td class="table_td">門市保養及查詢支援</td>
            <td>免費</td>
          </tr>
          <tr>
            <td colspan="2" class="service">自選附加服務</td>
          </tr>
          <tr>
            <td class="table_td">香港註冊牙醫檢查</td>
            <td>向門市微笑顧問查詢</td>
          </tr>
          <tr>
            <td class="table_td">深圳自有光門診牙醫檢查</td>
            <td>免費</td>
          </tr>
          <tr>
            <td class="table_td" style="border-radius: 0px 0px 0px 45px">
              Beame Care+
            </td>
            <td class="table_td" style="border-radius: 0px 0px 45px 0px">
              箍牙客戶專屬固定器優惠方案，佩戴固定器期間牙齒走位可享免費重啟。
            </td>
          </tr>
        </table>
        <button @click="jump('Rule')" class="scheme_button">
          立即預約箍牙諮詢
        </button>
      </div>
    </div> -->
    <div style="position: relative" v-if="equipment == 'pc'">
      <div class="Heavyhoop">
        <h3 class="Heavyhoop_h3">Beame 箍牙客戶專屬優惠</h3>
        <h2 class="Heavyhoop_h2">Beame Care+</h2>
        <h2 class="Heavyhoop_h2_2">牙齒走位 免費重箍</h2>
        <p class="Heavyhoop_p">
          完成箍牙後依照指示佩戴固定器，<br />
          期間發生任何牙齒走位，<br />
          可免費重啟箍牙。
        </p>
      </div>

      <img
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_48.png?x-oss-process=image/resize,w_1500/format,webp'
        "
        alt="Beame 透明牙箍方便外出攜帶，可以隨時穿脫，適合在用餐前後脫下，令箍牙日常便舒適。"
      />
    </div>
    <div style="position: relative" v-if="equipment == 'move'">
      <div class="Heavyhoop">
        <h2 class="Heavyhoop_h2">Beame Care+</h2>
        <h2 class="Heavyhoop_h2_2">牙齒走位 免費重箍</h2>
        <p class="Heavyhoop_p">
          完成箍牙後依照指示佩戴固定器，<br />
          期間發生任何牙齒走位， 可免費重啟箍牙。
        </p>
      </div>
      <h3 class="Heavyhoop_h3">
        <span class="Heavyhoop_span">beame</span> <br />
        箍牙客戶專屬優惠
      </h3>
      <img
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_54.png?x-oss-process=image/resize,w_800/format,webp'
        "
        alt="Beame 透明牙箍方便外出攜帶，可以隨時穿脫，適合在用餐前後脫下，令箍牙日常便舒適。"
      />
    </div>
    <div style="position: relative" class="gift">
      <div class="container-xl">
        <div class="gift_div" v-if="equipment == 'pc'">
          <div class="gift_div_2">
            <h2 class="process_h2_4">
              升級 Beame Pro 牙箍加送 <br />
              牙齒亮白套裝
            </h2>
            <h3 class="process_h3_4">3 種 Beame 潔齒實用工具</h3>
            <p class="gift_p">be@meSonic™星際聲波電動牙刷 ($2355/套)</p>
            <p class="gift_p">be@me™智能家用牙齒美白儀 1 套 ($1150/套)</p>
            <p class="gift_p">be@me™ V34 牙齒去黃液 ($880/套)</p>
          </div>
          <img
            class="gift_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_49.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="網上預約 Beame 箍牙加送牙齒亮白套裝，內含 3 種 Beame 潔齒實用工具，包括電動牙刷、牙齒美白儀、牙齒去黃液。"
          />
        </div>

        <div class="gift_div" v-if="equipment == 'move'">
          <div class="gift_div_2">
            <h2 class="process_h2_4">
              升級 Beame Pro 牙箍加送 <br />
              牙齒亮白套裝
            </h2>
            <h3 class="process_h3_4">3 種 Beame 潔齒實用工具</h3>
            <p class="gift_p">be@meSonic™星際聲波電動牙刷 ($2355/套)</p>
            <p class="gift_p">be@me™智能家用牙齒美白儀 1 套 ($1150/套)</p>
            <p class="gift_p">be@me™ V34 牙齒去黃液 ($880/套)</p>
            <h3 class="gift_h3">價值 <span class="gift_span">$4385</span></h3>
            <button @click="jump('Rule')" class="gift_button">
              立即預約箍牙諮詢
            </button>
          </div>
          <img
            class="trim_img"
            v-lazy="
              'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_51.png?x-oss-process=image/resize,w_800/format,webp'
            "
            alt="網上預約 Beame 箍牙加送牙齒亮白套裝，內含 3 種 Beame 潔齒實用工具，包括電動牙刷、牙齒美白儀、牙齒去黃液。"
          />
        </div>
      </div>
    </div>
    <div v-if="equipment == 'pc'" class="evaluate container-xl">
      <h2 class="evaluate_h2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />媒體推薦牙科服務
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="evaluate_h3">
        1200+ 評價 4.8
        <img class="evaluate_img_3" src="../img/aboutimplant_7.png" alt="" />
      </h3>
      <div class="evaluate_div">
        <img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_30.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="香港01 曾比較香港箍牙品牌 Zenyum、Invisalign、Dr Clear Aligner的收費及箍牙服務細節。"
        />
        <img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_31.webp'
          "
          alt="《新聞透視》曾報導深圳自有光牙科服務，香港人面對香港牙科昂貴而北上睇牙。"
        /><img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_32.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="新假期周刊曾推介 Beame 直營牙科自有光的洗牙服務。"
        /><img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_33.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="Gotrip 姐妹媒體報導 Beame 及自有光服務。"
        /><img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_34.webp'
          "
          alt="UrbanLife 健康新態度曾報導 Beame 箍牙及選擇透明牙箍留意三項重點。"
        />
        <br />
        <img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_35.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="COSMOPOLITAN 曾介紹 Beame 箍牙的推薦原因及箍牙細節。"
        /><img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_36.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="ELLE 曾介紹 Beame 箍牙，比較 Zenyum 及隱適美透明牙箍價錢療程。"
        /><img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_37.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="南華早報集團旗下媒體曾報導 Beame 箍牙模式及收費。"
        /><img
          class="evaluate_img"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_38.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt="mami daily 親子日常曾推薦 Beame 旗下門診自有光的牙科服務。"
        />
      </div>
      <button @click="jump('Rule')" class="scheme_button">
        立即預約箍牙諮詢
      </button>
    </div>
    <div v-if="equipment == 'move'" class="evaluate container-xl">
      <h2 class="evaluate_h2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />媒體推薦牙科服務
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="evaluate_h3">
        1200+ 評價 4.8
        <img class="evaluate_img_3" src="../img/aboutimplant_7.png" alt="" />
      </h3>
      <div class="evaluate_div">
        <img
          style="width: 100%"
          v-lazy="
            'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_56.png?x-oss-process=image/resize,w_800/format,webp'
          "
          alt=""
        />
      </div>
      <button @click="jump('Rule')" class="scheme_button">
        立即預約箍牙諮詢
      </button>
    </div>

    <div style="position: relative">
      <img
        v-if="equipment == 'pc'"
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_37.png?x-oss-process=image/resize,w_1500,limit_1/quality,q_75/format,webp'
        "
        alt="Beame WhatsApp 客服解答有關箍牙諮詢疑問，可協助客人預約門市箍牙諮詢。"
      />
      <img
        v-if="equipment == 'move'"
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_40.png?x-oss-process=image/resize,w_800/format,webp'
        "
        alt="Beame WhatsApp 客服解答有關箍牙諮詢疑問，可協助客人預約門市箍牙諮詢。"
      />
      <div class="address">
        <h2 class="address_h2">還有疑問？</h2>
        <h2 class="address_h3">WhatsApp 聯絡專人解答</h2>
        <a
          target="_blank"
          href="https://api.whatsapp.com/send/?phone=85266627628&text=查詢be@me箍牙服務"
        >
          <button class="address_button">點擊 WhatsApp 查詢</button></a
        >
      </div>
    </div>
    <div style="position: relative">
      <img
        v-if="equipment == 'pc'"
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-19.png?x-oss-process=image/resize,w_1500/format,webp'
        "
        alt="Beame 門市提供初步箍牙諮詢服務，由專人 1 對 1 解答任何 Beame 箍牙收費、細節、領取牙箍。"
      />
      <img
        v-if="equipment == 'move'"
        class="trim_img"
        v-lazy="
          'https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-20.png?x-oss-process=image/resize,w_800/format,webp'
        "
        alt="Beame 門市提供初步箍牙諮詢服務，由專人 1 對 1 解答任何 Beame 箍牙收費、細節、領取牙箍。"
      />
      <div class="StoreLocation">
        <H2 class="StoreLocation_h2"
          >be@me 門市 <br />
          及體驗空間</H2
        >
        <p class="StoreLocation-p">
          <img
            src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-12.png"
            alt=""
          />門市：初步諮詢箍牙方案、支付費用、領取牙套。
        </p>
        <p class="StoreLocation-p">
          <img
            src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/experience-room-13.png"
            alt=""
          />體驗空間：註冊牙醫駐場，直接進行 3D 口腔掃描。
        </p>
      </div>
      <div class="team">
        <h2 class="team_h2">牙醫設計</h2>
        <h3 class="team_h3">及跟進箍牙方案</h3>
        <p class="team_p">
          由專業牙醫設計所有細節，<br />
          團隊跟進每個個案、聯絡、保養。<br />
          有任何疑慮？<br />
          香港同事 1 對 1 為你疑惑。
        </p>
      </div>
    </div>
    <!-- <div class="container-xl">
      <h2 class="service3_h2">
        3 種免費諮詢方式 <br />
        無壓力開始箍牙
      </h2>
      <div class="advisory" v-if="equipment == 'pc'">
        <div v-for="(item, index) in box2" :key="index">
          <div
            :style="`background-image: url('${item.img}') `"
            class="box3"
            :class="{
              'box2-hover': hoveredIndex2 === index,
              'box2-shrink': hoveredIndex2 !== null && hoveredIndex2 !== index,
            }"
            @mouseover="showOverlay2(index)"
            @mouseleave="hideOverlay2"
            @click="btnjump(item.url, 'aligner_3', 0)"
          >
            <h2 class="title" v-if="hoveredIndex2 !== index">
              {{ item.title }}
            </h2>
            <div class="box_text3" :class="{ visible: item.isOverlayVisible }">
              <h2 class="title">{{ item.title }}</h2>
              <h4 class="pp">{{ item.pp }}</h4>
              <p class="pp2" v-html="item.pp2"></p>
              <button class="box_btn">{{ item.button }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'move'">
        <div class="box2" v-for="(item, index) in box2" :key="index">
          <img class="box_img2" :src="item.img_move" alt="" />
          <div class="box_text2" @click="btnjump(item.url, 'aligner_3', 1)">
            <h2>{{ item.title }}</h2>
            <h4>{{ item.pp }}</h4>
            <p v-html="item.pp2"></p>
            <button class="box_btn">{{ item.button }}</button>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'pc'">
        <div v-for="(item, index) in box1" :key="index">
          <div
            :style="`background-image: url('${item.img}') `"
            class="box"
            :class="{
              'box-hover': hoveredIndex === index,
              'box-shrink': hoveredIndex !== null && hoveredIndex !== index,
            }"
            @mouseover="showOverlay(index)"
            @mouseleave="hideOverlay"
            @click="btnjump(item.url === '#Rule1' ? '#Rule' : item.url)"
          >
            <h2 class="title" v-if="hoveredIndex !== index">
              {{ item.title }}
            </h2>
            <div class="box_text" :class="{ visible: item.isOverlayVisible }">
              <h2 class="title">{{ item.title }}</h2>
              <h4 class="pp">{{ item.pp }}</h4>
              <p class="pp2">{{ item.pp2 }}</p>
              <button class="box_btn">{{ item.button }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="advisory" v-if="equipment == 'move'">
        <div class="box2" v-for="(item, index) in box1" :key="index">
          <img class="box_img2" :src="item.img" alt="" />
          <div
            class="box_text2"
            @click="btnjump(item.url === '#Rule1' ? '#Rule' : item.url)"
          >
            <h2>{{ item.title }}</h2>
            <h4>{{ item.pp }}</h4>
            <p>{{ item.pp2 }}</p>
            <button class="box_btn">{{ item.button }}</button>
          </div>
        </div>
      </div>
    </div> -->
    <div>
      <div class="container-xl shop" id="Rule">
        <h2 class="shop_h2">線上預約箍牙諮詢即享優惠價</h2>
        <p class="shop_p">1. 選擇 be@me 門市</p>
        <div class="shop_div">
          <van-collapse
            aria-expanded="true"
            style="text-align: left"
            v-for="item in items"
            :key="item.id"
            v-model="activeNames"
            ref="open_me"
          >
            <van-collapse-item
              v-if="item.name_tc != '深圳'"
              :name="item.name_tc"
              :id="item.name_tc"
            >
              <template #title>
                <div class="name">{{ item.name_tc }}</div>
              </template>
              <div
                @click="selectClinic(clinic)"
                class="deta"
                v-for="clinic in item.clinics"
                :key="clinic.id"
                :class="cityData.id == clinic.id ? 'fengqi_2' : ''"
              >
                <div class="deta_div">
                  <img
                    :src="`${clinic.image}?x-oss-process=image/resize,w_500/format,webp`"
                    class="clinic-img"
                    alt=""
                  />
                </div>
                <div class="deta_div_2">
                  <h3 class="deta_h3">{{ clinic.shop_name_cn }}</h3>
                  <p class="deta_p">
                    <img src="@/img/Group7431.png" alt="" />{{
                      clinic.phone_cn
                    }}
                  </p>
                  <p class="deta_p">
                    <img src="@/img/Group7432.png" alt="" />{{
                      clinic.start_time_cn
                    }}-{{ clinic.end_time_cn }}
                  </p>
                  <p class="deta_p" v-if="clinic.address_cn != null">
                    <img src="@/img/button icon_1@2x1.png" alt="" />{{
                      clinic.address_cn
                    }}
                  </p>
                </div>
              </div>
            </van-collapse-item>
          </van-collapse>
          <div id="time"></div>
        </div>
      </div>
    </div>
    <div class="container-xl calendar_div">
      <div class="row">
        <p class="calendar_p">2. 選擇諮詢時間及日期</p>
        <div class="col-lg-6 calendar">
          <div class="pc">
            <van-calendar
              :poppable="false"
              confirm-text="Sure"
              color="#00E467"
              v-model="show"
              :default-date="new Date(this.date)"
              :max-date="maxDate"
              :formatter="formatter"
              @confirm="onConfirm"
              :show-confirm="false"
              :style="{ height: '520px' }"
              :show-title="false"
              @select="onSelect"
            />
          </div>
        </div>
        <div class="col-lg-6 choice">
          <div class="time-button" v-for="(value, index) in time" :key="index">
            <div v-if="value <= 0">
              <button class="list-item" style="background-color: #eee">
                {{ index }}
                <span class="list-item_span">(預約已滿)</span>
              </button>
            </div>
            <div v-else>
              <button
                @click="clickTime(index)"
                class="list-item"
                :style="start == index ? 'background-color:#00e567' : ''"
              >
                {{ index }}
              </button>
            </div>
          </div>
        </div>
        <div id="information"></div>
      </div>
    </div>
    <div class="container-xl">
      <div class="row">
        <p class="calendar_p2">3. 填寫個人資料</p>
        <div class="col-lg-12 calendar">
          <div class="input">
            <!-- <van-field
              v-model="userName"
              label="Name"
              placeholder="Full Name in English"
            /> -->
            <div class="input_name">
              <span class="input_span">姓名</span
              ><el-input
                v-model="userName"
                placeholder="輸入你姓名（身份證或護照姓名）"
              ></el-input>
            </div>
            <div class="input_name">
              <span class="input_span">性別</span>
              <van-radio-group
                style="margin-left: 5px"
                v-model="sex"
                direction="horizontal"
                checked-color="#00E467"
              >
                <van-radio name="男">男</van-radio>
                <van-radio name="女">女 </van-radio>
                <van-radio name="隱藏">隱藏</van-radio>
              </van-radio-group>
            </div>
            <div class="service_div">
              <div class="service">
                箍牙人士身份&nbsp;&nbsp;
                <span class="characteristic">(可多選)</span>
              </div>

              <van-checkbox-group
                v-model="customerService"
                direction="horizontal"
                checked-color="#00E467"
                @change="handleChange"
              >
                <van-checkbox name="1" :disabled="isFirstDisabled"
                  >初次箍牙</van-checkbox
                >
                <van-checkbox name="2" :disabled="isSecondDisabled"
                  >二次重箍</van-checkbox
                >
                <van-checkbox name="3">中/大學生</van-checkbox>
                <van-checkbox name="4">兒童（小學生）</van-checkbox>
                <van-checkbox name="5">準婚人士</van-checkbox>
              </van-checkbox-group>
            </div>
            <div class="input_name">
              <span class="input_span">服務類別</span>
              <van-radio-group
                style="margin-left: 5px"
                v-model="category"
                direction="horizontal"
                checked-color="#00E467"
              >
                <van-radio
                  name="19"
                  :disabled="disabledCategories.includes('19')"
                  >箍牙初步諮詢</van-radio
                >
                <van-radio name="6" :disabled="disabledCategories.includes('6')"
                  >領取牙套</van-radio
                >

                <van-radio
                  name="20"
                  :disabled="disabledCategories.includes('20')"
                  >固定器諮詢</van-radio
                >

                <van-radio
                  name="21"
                  :disabled="disabledCategories.includes('21')"
                  >現有客戶跟進</van-radio
                >
              </van-radio-group>
            </div>
            <div class="input_name">
              <span class="input_span input_span_2">電話號碼</span>
              <el-select v-model="value" placeholder="香港+852">
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
              <el-input v-model="Phone" placeholder="12345678"></el-input>
            </div>
            <div class="input_name">
              <span class="input_span">邀請碼</span>
              <el-input
                v-model="invitationCode"
                placeholder="請輸入邀請碼"
              ></el-input>
            </div>
            <div class="input_name">
              <span class="input_span">電郵</span
              ><el-input
                v-model="mail"
                placeholder="example@mybeame.com"
              ></el-input>
            </div>
            <!-- <van-field
              v-model="mail"
              label="Email"
              placeholder="Please provide your email"
            /> -->
            <p class="hint">
              請填寫你的電話號碼和郵件，以便我們與你聯絡。這對於你的治療計劃、預約及其它健康相關疑問，甚至任何緊急更新都至關重要。
            </p>

            <button
              class="input_button"
              style="cursor: pointer"
              @click="kap1()"
              :loading="loading"
            >
              確認預約出席
            </button>
            <div class="subscription">
              <van-checkbox
                label-disabled
                v-model="checked"
                shape="square"
                checked-color="#00E467"
                >我已年滿 18 歲並同意
                <span @click="dialogVisible = true" class="subscription_span">
                  條款及細則
                </span>
                和
                <span @click="dialogVisible2 = true" class="subscription_span">
                  私隱政策</span
                >.</van-checkbox
              >
            </div>
            <el-dialog title="Terms & Conditions" :visible.sync="dialogVisible">
              <ConsentAgreementEn></ConsentAgreementEn>

              <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="dialogVisible = false"
                  >確 定</el-button
                >
              </span>
            </el-dialog>
            <el-dialog title="" :visible.sync="dialogVisible2">
              <PrivacyPolicyEn></PrivacyPolicyEn>

              <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="dialogVisible2 = false"
                  >確 定</el-button
                >
              </span>
            </el-dialog>
          </div>
        </div>
      </div>
    </div>
    <div class="query container-xl">
      <h3 class="confidence_title">常見問題</h3>
      <div class="answer">
        <el-collapse v-model="activeNames">
          <el-collapse-item title="Beame 透明牙箍包多少次牙醫見面？" name="1">
            <div>
              Beame
              提供彈性選擇給客戶，依牙齒實際狀況自行增減牙醫覆診的次數。對於以美齒前提的輕微牙齒走位狀況，能大大降低箍牙所需支出。同時，複雜個案亦可選擇較頻密的覆診周期，確保矯正過程安全可靠。
              <br /><br />
              由於牙醫門診選址及背景不同，覆診診金也有所不同，Beame
              將會在事前再向客人報價。一般情況下，以 Beame
              彈性方案完成矯正時，仍然比其它品牌約 $40,000 至 $60,000
              的綑綁及固定覆診方案便宜。
            </div>
          </el-collapse-item>
          <el-collapse-item
            title="磨牙等額外箍牙前準備工序需要收費嗎？"
            name="2"
          >
            <div>
              一般而言，調整前牙的 Beame 透明牙箍方案毋須磨牙及拔牙，而選用
              Beame Pro 透明牙箍則已經包括照 X
              光及磨牙服務，而其它額外需要取決於牙齒狀況決定，詳情可於門市諮詢後向微笑顧問查詢。
              <br /><br />
              另外，除了香港合作牙醫外，你亦可選擇 Beame
              自有光深圳旗艦級門診牙醫，比香港 1/3
              的高性價比價錢完成矯正前準備。
            </div>
          </el-collapse-item>
          <!-- <el-collapse-item title="What is a beame Clinic?" name="3">
            <div>
              beame Clinics are where your smile journey begins! Our scan
              specialist will take a 3D scan of your teeth, which is quick,
              painless, and completely non-invasive. Our orthodontics team will
              then use this scan to create a personalised treatment plan just
              for you.
            </div>
          </el-collapse-item> -->
          <el-collapse-item
            title="參與 Beame 透明牙箍需要到深圳自有光門診嗎？"
            name="3"
          >
            <div>
              不一定。一般情況下，你可選擇到深圳自有光門診或香港合作牙科診所進行
              3D 口腔牙齒掃描分析及其他相關服務。自有光深圳門診由 Beame
              香港團隊主理，可以提供性價比更高的服務，如需磨牙、拔牙、安裝附加物等特殊情況下，也可額外選擇在自有光門診進行。當然，你亦可以到
              Beame 在香港的合作牙醫門診進行其他矯正前準備。
            </div>
          </el-collapse-item>
          <el-collapse-item
            title="假如我在門市諮詢後不接受報價，我將會被收費嗎？"
            name="4"
          >
            <div>不會！你不會被收取任何費用。</div>
          </el-collapse-item>
          <el-collapse-item title="我可以臨時更改預約時間嗎？" name="5">
            <div>
              可以。請盡早透過 Whatsapp
              聯絡我們，告知我們你原本預約的資料、服務、時段，並且希望重新預約的日期或時段。
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    <div class="container-xl layout">
      <h2 class="process_h2">
        <img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />不只是箍牙<img
          class="star"
          src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_19.png"
          alt=""
        />
      </h2>
      <h3 class="process_h3_2">關心你的牙齒健康更多護齒知識</h3>
      <div class="knowledge row">
        <div class="col-lg-1"></div>
        <div class="BraceTeeth col-lg-5">
          <!-- <img class="knowledge_img" src="https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_21.png"
              alt="" /> -->
          <h2 class="BraceTeeth_h2">Beame 牙齒學堂</h2>
          <p class="BraceTeeth_p">
            齊集牙齒護理小知識，<br />
            由日常開始保護牙齒。
          </p>
          <button
            class="BraceTeeth_button"
            @click="jumps('https://smile.mybeame.com/')"
          >
            即睇文章→
          </button>
        </div>
        <div class="BraceTeeth_2 col-lg-5">
          <h2 class="BraceTeeth_h2_2">自有光旗艦門診</h2>
          <p class="BraceTeeth_p_2">
            免費 CT 牙齒檢查服務，<br />
            及早發現牙齒問題。<br />
            專為香港人服務，<br />
            降低睇牙門檻。
          </p>
          <a href="/promotion"
            ><button class="BraceTeeth_button">睇牙優惠→</button></a
          >
        </div>
        <div class="col-lg-1"></div>
      </div>
    </div>
    <div class="Bottom_Kindly">
      <p>
        1. 請注意，Beame
        香港門市並不提供醫療服務。醫療服務和分析會由專業牙科醫生提供。
      </p>
      <p>
        2. Beame 香港門市預約提供免費牙套諮詢及體驗等，專業 3D
        口腔掃描及分析將會於牙科診所進行。
      </p>
      <p>
        3.
        箍牙結果會因各種因素而異，例如你的整體牙齒狀況、是否遵守牙醫的指示、牙箍的使用時間。
      </p>
    </div>
    <!-- 手机版顶部优惠卷悬浮图片 -->
    <!-- <TopimageHK> </TopimageHK> -->
    <!-- 悬浮组件 -->
    <!-- <Floatingbutton></Floatingbutton> -->
    <Floatingbutton2 :buttonType="'aligner_'" :pageId="uniqueId" />
    <!-- 底部组件 -->
    <BottomSZ></BottomSZ>

    <!-- 底部组件封装 -->
    <!-- <Bottomsg></Bottomsg> -->
  </div>
</template>
<script>
import {
  getAllOutpatientCityInfo,
  recordBrowse,
  getTimeEnable,
  confirmAppointmentClinic,
  getDateEnable,
  buttonClickThroughRate,
} from "@/api/outpatient";
// import TopimageHK from "@/components/TopimageHK.vue";
import BottomSZ from "@/components/BottomSZ.vue";
import NavigationHK from "@/components/NavigationHK.vue";
import Bottomsg from "@/components/Bottomsg.vue";
import Floatingbutton from "@/components/Floatingbutton.vue";
import Floatingbutton2 from "@/components/Floatingbutton2.vue";
import ConsentAgreementEn from "@/components/ConsentAgreementEn.vue";
import PrivacyPolicyEn from "@/components/PrivacyPolicyEn.vue";
import rolling from "@/components/rolling.vue";

import { Loading } from "element-ui";
import "element-ui/lib/theme-chalk/loading.css";
import Bottom from "@/components/Bottom.vue";

export default {
  head: {
    title: "be@me 透明牙箍︱隱形牙套箍牙價錢 全程牙醫跟進",
    link: [
      {
        rel: "canonical",
        href: "https://mybeame.com/aligner",
      },
      {
        rel: "alternate",
        href: "https://mybeame.com/aligner",
        hreflang: "zh-hk",
      },
      {
        rel: "alternate",
        href: "https://mybeame.com/zh-en/aligner",
        hreflang: "zh-en",
      },
      {
        rel: "alternate",
        href: "https://mybeame.com/zh-mo/aligner",
        hreflang: "zh-mo",
      },
      {
        rel: "alternate",
        href: "https://mybeame.com/aligner",
        hreflang: "x-default",
      },
    ],
    meta: [
      {
        name: "description",
        content:
          "be@me 透明牙箍價錢及種類，香港箍牙門市 1 對 1 諮詢，最快 6 個月完成矯正。牙醫跟進隱形牙套過程，門市 3D 口腔掃描即全方位了解牙齒狀況。",
      },
      {
        property: "og:title",
        content: "be@me 透明牙箍︱隱形牙套箍牙價錢 全程牙醫跟進",
      },
      {
        property: "og:description",
        content:
          "be@me 透明牙箍價錢及種類，香港箍牙門市 1 對 1 諮詢，最快 6 個月完成矯正。牙醫跟進隱形牙套過程，門市 3D 口腔掃描即全方位了解牙齒狀況。",
      },
    ],
  },
  components: {
    NavigationHK,
    Bottomsg,
    ConsentAgreementEn,
    PrivacyPolicyEn,
    Floatingbutton,
    Floatingbutton2,
    rolling,
    Bottom,
    BottomSZ,
    // TopimageHK,
  },
  data() {
    return {
      dialogVisible: false,
      dialogVisible2: false,
      payment: 1,
      card: 1,
      category: "",
      CityCamedata: "",
      invitationCode: "",
      overturndata: 1,
      cityData: [],
      textarea: "",
      content: "Book Teeth Scan",
      activeNames: ["香港", "澳門", "深圳"], //门诊折叠面板
      items: [],
      equipment: "pc",
      date: "",
      show: false,
      time: {
        "09:00-09:40": 1,
        "09:40-10:20": 1,
        "10:20-11:00": 1,
        "11:00-11:40": 1,
        "11:40-12:20": 1,
        "12:20-13:00": 1,
        "13:00-13:40": 1,
        "13:40-14:20": 1,
        "14:20-15:00": 1,
        "15:00-15:40": 1,
        "15:40-16:20": 1,
        "16:20-17:00": 1,
      },
      start: null,
      timeData: "",
      minDate: new Date(),
      maxDate: new Date(),
      business_date: {},
      loading: false,
      checked: true,
      userName: "",
      Phone: "",
      mail: "",
      sex: "",
      result: [],
      customerService: ["1"],
      isFirstDisabled: false,
      isSecondDisabled: false,
      value: "852",
      // showPicker: false,
      options: [
        //添加手机号码区号
        {
          value: "852",
          label: "香港+852",
        },
        {
          value: "86",
          label: "中國 +86",
        },
        {
          value: "853",
          label: "澳門+853",
        },
      ],
      isNavbarVisible: false,
      list: [
        {
          name: "TÜV NORD 認證",
        },
        {
          name: "持久抗污",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/SG_select_location_10.png",
        },
        {
          name: "舒適佩戴",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/SG_select_location_11.png",
        },
        {
          name: "牙醫設計",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/SG_select_location_12.png",
        },
        {
          name: "真人客服跟進",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/SG_select_location_13.png",
        },
      ],
      selectedDate: null, // 用于存储用户点击的日期（Date对象）
      hoveredIndex: null,
      hoveredIndex2: null,
      box1: [
        {
          title: "預約門市/體驗空間諮詢",
          pp: "面對面解答疑問",
          pp2: "箍牙諮詢、領取牙箍、3D 掃描、牙醫預約，自行決定日期、時間、地點，諮詢後不參與亦無問題",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-70.png?x-oss-process=image/resize,w_1500/format,webp",
          isOverlayVisible: false,
          url: "#Rule",
          button: "立即預約",
        },
        {
          title: "線上快速箍牙評估",
          pp: "5 分鐘極速完成",
          pp2: "安在家中即可開始，交由 be@me 團隊率先了解牙齒狀況。完成評估由客服 WhatsApp 聯絡。",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/mybeameNewHK-69.png?x-oss-process=image/resize,w_1500/format,webp",
          isOverlayVisible: false,
          url: "/test1",
          button: "開始評估",
        },
      ],
      box2: [
        {
          title: "療程專員回覆箍牙疑問",
          pp: "WhatsApp 即時解答",
          pp2: "了解價錢、箍牙方法、解答疑問 <br> 服務時間：10:30-18:30",
          img: "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_57.png",
          img_move:
            "https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/aligner_58.png",
          isOverlayVisible: false,
          url: "https://api.whatsapp.com/send/?phone=85266627628&text=%E6%88%91%E6%83%B3%E6%9F%A5%E8%A9%A2%E7%AE%8D%E7%89%99/%E7%99%82%E7%A8%8B%E5%B0%88%E5%93%A1%E8%A7%A3%E7%AD%94%E7%96%91%E5%95%8F",
          button: "立即查詢",
        },
      ],
      resizeTimer: null,
      threshold: 850, // 统一断点阈值
      uniqueId: "", //进入页面ID
      check: 0,
      disabledCategories: [],
    };
  },
  watch: {
    "cityData.id": {
      handler(newVal) {
        if (newVal === 3010 || newVal === 3011) {
          // 只能选择箍牙初步諮詢和固定器諮詢
          this.disabledCategories = ["6", "21"];
          if (this.category !== "19" && this.category !== "20") {
            this.category = ""; // 默认空
          }
        } else if (
          [3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020].includes(newVal)
        ) {
          // 只能选择箍牙初步諮詢
          this.disabledCategories = ["6", "20", "21"];
          if (this.category !== "19") {
            this.category = "19"; // 自动选中箍牙初步諮詢
          }
        } else {
          this.disabledCategories = []; // 清空禁用列表，所有选项可选
        }
      },
      immediate: true, // 立即执行一次
    },
  },
  mounted() {
    this.loadData();
    this.date = this.formatDate(new Date()); //获取当前时间
    this.maxDate = this.getNewDay(14); //执行获取往后14天可以预约时间事件
    // this.publicize = JSON.parse(localStorage.getItem("phrase"));
    this.invitationCode = this.$route.query.code || "";
    this.checkDeviceAndUpdateSize();
    window.addEventListener("resize", this.handleResize);
    this.uniqueId = `${Date.now()}${Math.random().toString(36).slice(2, 11)}`;
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    //判断是什么设备登录
    checkDeviceAndUpdateSize() {
      const isMobile =
        process.client &&
        /(phone|pad|iPhone|Android|Mobile)/i.test(navigator.userAgent);
      this.updateScreenSize();
      this.equipment =
        isMobile || this.screenWidth < this.threshold ? "move" : "pc";
    },
    updateScreenSize() {
      if (!process.client) return;
      this.screenWidth = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth,
        document.body.clientWidth
      );
    },
    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.updateScreenSize();
        this.equipment = this.screenWidth < this.threshold ? "move" : "pc";
      }, 200); // 200ms防抖
    },
    //跳转
    btnjump(url, Type, num) {
      if (url.includes("api.whatsapp.com")) {
        var uresData = {
          button_type: Type,
          page_id: this.uniqueId,
          region: 2,
          is_mobile: num,
        };
        buttonClickThroughRate(uresData).then((res) => {});
        window.open(url, "_blank");

        return;
      }

      if (url.startsWith("#")) {
        // 锚点跳转逻辑
        const id = url.substring(1);
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // 路由跳转逻辑
        this.$router.push({
          path: url,
          query: {
            source: 1, // 参数名和值
          },
        });
      }
    },
    //锚点跳转
    jump(id) {
      // this.isActive = this;
      document.querySelector("#" + id).scrollIntoView(true);
    },
    // 用于专门跳转外部链接
    jumps(route) {
      window.open(route, "_self");
    },
    // 大小变换
    showOverlay(index) {
      this.hoveredIndex = index;
      this.$set(this.box1, index, {
        ...this.box1[index],
        isOverlayVisible: true,
      });
    },
    hideOverlay() {
      this.hoveredIndex = null;
      this.box1.forEach((item, index) => {
        this.$set(this.box1, index, {
          ...item,
          isOverlayVisible: false,
        });
      });
    },
    // 大小变换
    showOverlay2(index) {
      this.hoveredIndex2 = index;
      this.$set(this.box2, index, {
        ...this.box2[index],
        isOverlayVisible: true,
      });
    },
    hideOverlay2() {
      this.hoveredIndex2 = null;
      this.box2.forEach((item, index) => {
        this.$set(this.box2, index, {
          ...item,
          isOverlayVisible: false,
        });
      });
    },

    // 多选控制 不可同时选择初次箍牙和二次重箍
    handleChange(selected) {
      const hasFirst = selected.includes("1");
      const hasSecond = selected.includes("2");

      if (hasFirst && hasSecond) {
        // 如果同时选中了两个互斥选项
        if (this.customerService.includes("2")) {
          this.customerService = this.customerService.filter(
            (item) => item !== "1"
          );
        } else {
          this.customerService = this.customerService.filter(
            (item) => item !== "2"
          );
        }
      }

      this.isFirstDisabled = this.customerService.includes("2");
      this.isSecondDisabled = this.customerService.includes("1");
    },
    //获取后台门诊信息
    loadData() {
      var params = "";
      if (this.select) {
        params += "&&city=" + this.select;
      }
      getAllOutpatientCityInfo(params)
        .then((res) => {
          // console.log(res.data.items);
          // 翻转数组
          const arr = res.data.items;
          const reversedArr = arr.reverse();
          // console.log(reversedArr);
          this.items = reversedArr;
        })
        .catch((err) => {});
    },

    //选择的城市
    selectClinic(data) {
      var formData = {
        id: data.id,
        name: data.shop_name_cn,
        city: data.city_cn,
        phone: data.phone_cn,
        img: data.image,
        BH: data.start_time_cn + "-" + data.end_time_cn,
        address: data.address_cn,
      };
      // if (formData.id == 1001) {
      //   this.$message({
      //     message: "微笑升級進行中",
      //     type: "warning",
      //   });
      //   return;
      // }
      localStorage.setItem("city", JSON.stringify(formData));
      this.cityData = formData;

      // const targetElement = document.querySelector("#time");
      // const targetPosition =
      //   targetElement.getBoundingClientRect().top + window.scrollY - 100; // 计算目标位置并加上px
      // window.scrollTo({
      //   top: targetPosition,
      //   behavior: "smooth", // 平滑滚动
      // });
      this.sj();
      // localStorage.setItem("city", JSON.stringify(formData));
    },
    //获取当天所有可以预约时间事件
    sj() {
      var uresData = {
        id: this.cityData.id,
        day: this.date,
      };
      // 获取所有可以预约时间请求
      getDateEnable(uresData).then((res) => {
        this.business_date = res.business_date;
        this.publicize = res.phrase;
        this.date = res.current_date;
        this.time = res.data;
        const dateString = this.date;
        // 将字符串解析为Date对象（由于格式是'YYYY-MM-DD'，所以会被自动解析为UTC时间，然后转换为本地时间CST）
        const yesterday = new Date(dateString);
        // 由于我们的本地时区是CST，所以yesterday现在表示的是CST时间
        // 将调整后的日期对象赋值给selectedDate
        this.selectedDate = yesterday;
        this.selectedDate.setDate(this.selectedDate.getDate() - 1);
      });
    },

    onSelect(date) {
      this.selectedDate = date; // 更新用户点击的日期
    },
    formatter(day) {
      // 格式化日期为 YYYY-MM-DD 格式
      const formattedDate = day.date.toISOString().split("T")[0];

      // 判断不可预约日期（原有逻辑，保持不变）

      // 创建一个表示前一天的日期对象
      const previousDay = new Date(day.date);
      previousDay.setDate(previousDay.getDate() + 1);

      // 格式化前一天的日期为 YYYY-MM-DD 格式
      const currentDayStr = previousDay.toISOString().split("T")[0];
      if (this.business_date && this.business_date[currentDayStr] === 0) {
        day.type = "disabled";
      }

      // 判断是否是当天日期（新逻辑）
      const isToday =
        this.selectedDate &&
        formattedDate === this.selectedDate.toISOString().split("T")[0];

      // 返回对象时，保留原始对象的所有属性，并添加自定义的className属性
      return {
        ...day,
        className: isToday ? "selected-day-class" : "", // 只有在是当天日期时才添加自定义类名
        // 注意：这里还可以添加其他逻辑来处理被点击的日期等场景
      };
    },

    //当天时间显示
    formatDate(date) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const today = new Date().getDay();
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    //执行获取往后14天不可以预约时间事件
    getNewDay(days) {
      var nDate = new Date();
      var millSeconds = Math.abs(nDate) + days * 24 * 60 * 60 * 1000;
      var rDate = new Date(millSeconds);
      var year = rDate.getFullYear();
      var month = rDate.getMonth() + 1;
      if (month < 10) month = "0" + month;
      var date = rDate.getDate();
      if (date < 10) date = "0" + date;
      return new Date(year + "-" + month + "-" + date);
    },
    //选择的日期
    onConfirm(date) {
      this.date = this.formatDate(date);
      if (this.cityData == "") {
        this.$message({
          message: "請選擇診所",
          type: "warning",
        });
        document.querySelector("#Rule").scrollIntoView(true);
        this.show = false;

        return;
      }
      this.start = null;
      this.show = false;
      this.date = this.formatDate(date);

      var uresData = {
        id: this.cityData.id,
        day: this.date.split("/").reverse().join("-"),
      };
      //发送选择的日期可预约时间请求
      getTimeEnable(uresData).then((res) => {
        this.time = res.data;
      });
    },

    //点击选择时间的事件
    clickTime(start) {
      if (this.cityData == "") {
        this.$message({
          message: "Please choose a clinic",
          type: "warning",
        });
        document.querySelector("#Rule").scrollIntoView(true);
        return;
      }
      this.start = start;
      // const targetElement = document.querySelector("#information");
      // const targetPosition =
      //   targetElement.getBoundingClientRect().top + window.scrollY - 100; // 计算目标位置并加上60px
      // window.scrollTo({
      //   top: targetPosition,
      //   behavior: "smooth", // 平滑滚动
      // });
    },
    //预约
    kap1: function () {
      this.dialogVisible3 = true;
      if (
        this.userName == "" ||
        this.category == "" ||
        this.sex == "" ||
        this.Phone == ""
      ) {
        this.$message({
          message: "請在提交前提供所有必要的資訊。",
          type: "warning",
        });
        return;
      }

      if (/^.{2,60}$/.test(this.mail) == false) {
        this.$message({
          message: "電子郵件格式不正確",
          type: "warning",
        });
        return;
      }
      if (this.value == 852 || this.value == 853) {
        if (!/^\d{8}$/.test(this.Phone)) {
          this.$message({
            message: "請提交8位數字的手機號碼",
            type: "warning",
          });
          return;
        }
      } else if (this.value == 86) {
        if (!/^\d{11}$/.test(this.Phone)) {
          this.$message({
            message: "請提交11位數字的手機號碼",
            type: "warning",
          });
          return;
        }
      }
      if (this.start == null) {
        this.$message({
          message: "請選擇日期和時間",
          type: "warning",
        });
        return;
      }
      if (this.cityData.id == null) {
        this.$message({
          message: "請選擇門診",
          type: "warning",
        });
        return;
      }
      // 检查是否为单英文单词或两个英文单词的姓名
      // if (!/[\u4e00-\u9fa5]/.test(this.userName.trim())) {
      //   this.check = 1; // 符合要求：一个单词或两个单词
      // } else {
      //   this.check = 0; // 不符合要求：其他格式
      // }
      const trimmedName = this.userName.trim();
      let isSingleEnglishWord = false; // 符合要求：一个单词
      const hasChinese = /[\u4e00-\u9fa5]/.test(trimmedName); // 检查是否包含中文
      if (!hasChinese) {
        const words = trimmedName.split(/\s+/); //单词数量
        if (words.length === 1) {
          isSingleEnglishWord = true; // 不符合
        }
      }
      // this.check = isSingleEnglishWord ? 1 : 0;
      var time = {
        start: this.start,
        date: this.date,
      };
      localStorage.setItem("time", JSON.stringify(time));
      var liaison = {
        userName: this.userName,
        userPhone: this.value + this.Phone,
        mail: this.mail,
        sex: this.sex,
        selectedServices: this.category,
        customerService: this.customerService,
      };
      localStorage.setItem("liaison", JSON.stringify(liaison));

      //预约事件
      var uresData = {
        appointmentDate: this.date.split("/").reverse().join("-"),
        appointmentTime: this.start,
        outpatientId: this.cityData.id,
        name: this.userName,
        phone: this.value + this.Phone,
        email: this.mail,
        remark: this.notes,
        gender: this.sex,
        fbqEventId: this.fbqEventId,
        comeFrom: 31,
        needService: "隱形牙套",
        lang_status: "ch",
        customerService: this.customerService,
        qid: "",
        patient_type: this.category,
        check: this.check,
        referral_code: this.invitationCode,
      };

      this.loading = Loading.service({ fullscreen: true });

      //预约请求
      confirmAppointmentClinic(uresData)
        .then((res) => {
          if (res.code == 200) {
            this.loading.close();
            // 检查是否为单英文单词姓名
            // if (!/[\u4e00-\u9fa5]/.test(this.userName.trim())) {
            if (isSingleEnglishWord) {
              // 构建查询参数字符串
              const queryParams = new URLSearchParams({
                start: this.start,
                date: this.date,
                userName: this.userName,
                phone: this.value + this.Phone,
                mail: this.mail,
                clinicName: this.cityData.name,
                clinicAddress: this.cityData.address,
                clinicPhone: this.cityData.phone,
                clinicBH: this.cityData.BH,
                selectedServices: this.category,
                customerService: this.customerService,
              }).toString();

              // 跳转到外部链接并携带参数
              window.location.href = `https://beamealign.me/?${queryParams}`;
            } else {
              this.$router.push("/screenshot-hk");
            }
          } else {
            this.$message({
              message: "預約失敗，請重新預約",
              type: "warning",
            });
            this.loading.close();
          }
        })
        .catch((error) => {
          this.loading.close(); // 请求失败，也关闭加载状态
          this.$message({
            message: error.response.data.message,
            type: "warning",
          });
        });
    },

    // //链接跳转
    Jump(url, source = null) {
      if (source !== null) {
        const uresData = {
          button_type: "aligner_1",
          page_id: this.uniqueId,
          region: 102,
          is_mobile: this.equipment === "move" ? 1 : 0,
          action_source: 1,
        };
        buttonClickThroughRate(uresData).then((res) => {});
        this.$router.push({
          path: url,
          query: { source },
        });
      } else {
        this.$router.push(url);
      }
    },
    //锚点跳转
    goRule(event) {
      var ID = "#" + event;
      //document.getElementById(ID).scrollIntoView({
      document.querySelector(ID).scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    },
  },
};
</script>
<style scoped>
.van-calendar >>> .selected-day-class {
  background-color: #00e467 !important;
  /* 设置背景颜色 */
  color: #ffffff !important;
  /* 设置文本颜色（可选） */
  border-radius: 5px;
}
.container-xl {
  padding: 0;
}

.nav-link {
  font-size: 16px;
}

.row {
  margin-left: 0;
  margin-right: 0;
}

.hello >>> .bottom {
  border-radius: 0 !important;
}

.top {
  margin-top: 70px;
}

.logo {
  width: 140px;
  margin-left: 0px;
  /* margin-right: 150px; */
}

.fixed-top {
  box-shadow: 0 2px 2px #0000000d;
  width: 100%;
  position: fixed;
  top: 0px;
  right: 0;
  left: 0;
  z-index: 100;
  background-color: #ffffff;
}

.collapse {
  /* display: flex !important;
  flex-basis: auto; */
  justify-content: space-around;
}

.navbar-dark {
  padding: 0px;
}

.move {
  display: none;
}

.nav-item {
  margin: 0 22px;
}

.computer {
  margin-top: 70px;
}

.computer_div {
  width: 100%;
  /* padding-left: 25%; */
  text-align: center;
  animation: tracking-in-contract-bck-bottom 2s
    cubic-bezier(0.215, 0.61, 0.355, 1) both;
  /* overflow: hidden; */
  position: absolute;
  top: 19%;
  left: 0;
}

@keyframes tracking-in-contract-bck-bottom {
  0% {
    letter-spacing: 1em;
    transform: translateZ(400px) translateY(200px);
    opacity: 0;
  }

  40% {
    opacity: 0.6;
  }

  100% {
    transform: translateZ(0) translateY(0);
    opacity: 1;
  }
}

.computer_h1 {
  font-size: 72px;
  color: #00ce7c;
}
.computer_h2 {
  font-size: 32px;
  margin: 20px 0;
}
.computer_p {
  font-size: 20px;
  /* color: #20d167; */
  margin: 0px 0 50px 0;
}

.computer_span {
  /* font-size: 58px; */
  margin: 0 0 0 15px;
  color: #05b26b;
  font-family: "Omnium-ExtraBold";
}

.computer_span_1 {
  font-size: 32px;
  margin: 0 6px;
  color: #05b26b;
}

.computer_span_2 {
  font-size: 24px;
  color: #05b26b;
  text-decoration: line-through;
}

.computer_img {
  width: 100%;
  padding: 0 5%;
}

.computer_img_top {
  width: 100%;
  animation: fade-in-and-scale 2s cubic-bezier(0.39, 0.575, 0.565, 1) forwards;
}

@keyframes fade-in-and-scale {
  0% {
    /* 开始时图片在Z轴上移动，透明度为0，并且放大到1.5倍 */
    transform: translateZ(80px) scale(1.5);
    opacity: 0;
  }

  100% {
    /* 结束时图片在Z轴上无移动，透明度为1，并且缩放到原始大小 */
    transform: translateZ(0) scale(1);
    opacity: 1;
  }
}

.shop {
  text-align: center;
  padding: 70px 0 100px 0;
}

.shop_div {
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  flex-direction: column;
}

/* .place {
  background-color: #e9e9e9;
} */
.place_name {
  display: flex;
  justify-content: center;
  margin-bottom: 60px;
}

.place_button {
  width: 200px;
  margin: 0 30px;
  font-size: 24px;
  border: none;
  background-color: #fff;
  border-bottom: 4px solid #05b26b;
}

.switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 100px;
}

.shop_h2 {
  font-weight: 700;
  font-size: 42px;
  margin-bottom: 60px;
  text-align: center;
}

.shop_p {
  font-weight: 700;
  font-size: 26px;
  text-align: center;
  margin-bottom: 50px;
}

.name {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.van-collapse {
  padding: 0 20px;
  width: 100%;
}

.van-collapse >>> .van-collapse-item__wrapper {
  margin-top: 50px;
}

.van-collapse >>> .van-cell {
  border: 1px solid #323e48;
  border-radius: 50px;
  margin-bottom: 40px;
}

.deta {
  color: #323e48;
  width: 48%;
  display: flex;
  margin: 0 1% 40px 1%;
  padding: 20px;
  border-radius: 10px;
  cursor: pointer;
  background-color: #f5f5f5;
  box-shadow: 0px 0px 2px 2px rgba(47, 69, 74, 0.1);
  border: 1px solid #c9c7c7;
}

.deta_div {
  /* width: 35%; */
  margin-right: 25px;
  /* margin-bottom: 30px; */
}

.deta_div_2 {
  width: 55%;
}

.van-collapse >>> .van-collapse-item__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  /* background-color: #e9e9e9; */
}

.van-collapse-item__content {
  padding: 0;
}

.clinic-img {
  width: 280px;
  /* margin-bottom: 10px; */
  border-radius: 10px;
}

.deta_h3 {
  font-size: 26px;
  margin-top: 35px;
  margin-bottom: 52px;
}

.deta_p {
  font-size: 18px;
  margin: 0px 0 15px 0;
  display: flex;
  align-items: flex-start;
}

.deta_p > img {
  width: 30px;
  height: 30px;
  margin-right: 5px;
}

.deta_button {
  width: 80%;
  /* height: 30px; */
  padding: 9px 0 9px 0;
  border: 0 none;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  background: #00e567;
  border-radius: 50px;
  margin-top: 20px;
  border: 1px solid #00be55;
  font-family: "Comfortaa-Regular";
}

.deta_button_2 {
  width: 60%;
  height: 40px;
  padding: 10px 0px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  background: #00e567;
  border-radius: 50px;
  border: 1px solid #00be55;
  font-family: "Comfortaa-Regular";
  position: absolute;
  top: 58%;
  left: 50%;
  transform: translate(-50%, -0%);
}

.deta_button_3 {
  width: 25%;
  padding: 12px 10px;
  color: #fff;
  font-weight: 700;
  font-size: 22px;
  background: #05b26b;
  border-radius: 50px;
  border: none;
  font-family: "Comfortaa-Regular";
}

.move_img_3 {
  width: 40%;
  margin-top: 30px;
}

.el-button {
  margin-right: auto;
  margin-left: 15px;
}

.advantage {
  width: 70%;
  margin: 0 auto;
  text-align: center;
  padding: 0px 0 0px 0;
  margin-bottom: 20px;
}

.advantage_content {
  margin-bottom: 100px;
}

.advantage_2 {
  width: 90%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  justify-content: center;
}

.el-carousel >>> .el-carousel__indicator--horizontal button {
  width: 12px;
  height: 12px;
  background: #949494;
  border-radius: 50%;
  opacity: 0.5;
}

.el-carousel >>> .el-carousel__indicator--horizontal.is-active button {
  width: 12px;
  height: 12px;
  background: #05b26b;
  opacity: 1;
  border-radius: 10px;
}

.advantage_p {
  font-size: 20px;
  margin-bottom: 30px;
  text-align: center;
}

.advantage_p2 {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.advantage_h2 {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 50px;
  text-align: center;
  margin-top: 120px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.team_img {
  width: 100%;
  border-radius: 30px;
  margin: 10px 0 20px 0;
}

.fold_right {
  font-size: 24px;
  color: #00ba00;
  /* margin-right: 15%; */
}

.move_img {
  width: 100%;
}

.el-divider {
  background-color: #000;
}

.fengqi {
  color: #3ecb91;
  border: 3px solid #3ecb91 !important;
}

.fengqi_2 {
  border: 2px solid #3ecb91 !important;
}

.fengqi_3 {
  color: #05b26b;
  border-bottom: 3px solid #00be55 !important;
}

.compare {
  padding: 20px;

  display: flex;
  justify-content: space-evenly;
}

.compare_2 {
  width: 30%;
  padding: 5px;
  display: flex;
  justify-content: space-evenly;
}

.compare_div_right {
  width: 50%;
  position: relative;
  border-radius: 0px 20px 20px 0px;
  /* height: 260px; */
  /* background-color: #949494; */
}

.compare_div_left {
  width: 50%;
  position: relative;
  border-radius: 20px 0 0 20px;
  /* background-color: #e9e9e9; */
}

.compare_button_1 {
  width: 50%;
  height: 38px;
  border-radius: 50px;
  border: none;
  background-color: #fff;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%);
}

.compare_button_2 {
  width: 50%;
  height: 38px;
  border-radius: 50px;
  border: none;
  background-color: #8bfcab;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%);
}

.el-carousel >>> .el-carousel__arrow {
  background-color: transparent;
}

.el-carousel >>> .el-carousel__arrow i {
  color: rgba(0, 228, 103, 1);
  font-size: 42px;
  /* font-weight: 900; */
}

.el-carousel >>> .el-carousel__arrow--left {
  left: 20px;
}

.el-carousel >>> .el-carousel__arrow--right {
  right: 20px;
}

.waist {
  margin: auto;
  text-align: center;
}

.waist_button {
  width: 25%;
  /* height: 30px; */
  padding: 10px;
  border: 0 none;
  color: #fff;
  font-family: "Comfortaa-Regular";
  font-weight: 700;
  font-size: 20px;
  border-radius: 50px;
  margin-top: 45px;
  background: #05b26b;
  border: none;
}

.waist_button_2 {
  width: 25%;
  /* height: 30px; */
  padding: 10px 0 10px 0;
  border: 0 none;
  color: #fff;
  font-family: "Comfortaa-Regular";
  font-weight: 700;
  font-size: 20px;
  border-radius: 50px;
  margin-top: 100px;
  margin-bottom: 30px;
  background: #00e567;
  border: 1px solid #00be55;
}

.language {
  margin-right: 35px;
}

.el-dropdown-link {
  color: #ffffff;
  font-weight: 600;
}

.dropdown_Book {
  width: 100%;
  padding: 0px 10px;
  border: 0 none;
  color: #fff !important;
  font-family: "Comfortaa-Regular";
  font-size: 20px;
  border-radius: 50px;
  background: #05b26b;
  border: none;
  text-align: center;
}

.el-icon-arrow-down {
  color: #ffffff;
  font-weight: 600;
}

.shopify-section {
  height: 50px;
  background: linear-gradient(
    327deg,
    rgba(169, 255, 217, 1),
    rgba(34, 208, 103, 1) 31%,
    rgba(31, 221, 106, 1) 72%,
    rgba(2, 219, 78, 1) 94%
  );
  margin-bottom: 1px;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
}

.shopify-section_img {
  width: 22px;
  margin-right: 6px;
  padding-bottom: 5px;
}

.announcement-bar__message_p {
  margin: 0px 0px;
  text-align: left;
}

.announcement-bar__message_p_2 {
  margin: 0;
  /* text-align: left; */
}

.shopify-section_mobile {
  display: flex;
  overflow: hidden;
  align-items: center;
  text-align: center;
  justify-content: space-around;
}

.query {
  text-align: center;
  padding: 60px 0 50px 0;
}

.confidence_title {
  font-size: 42px;
  margin: 30px 0 60px 0;
  line-height: 40px;
}

.answer {
  width: 80%;
  margin: 0 auto;
  padding: 30px 0 50px 0;
  text-align: left;
}

.answer > h2 {
  margin-top: 20px;
  font-size: 22px;
}

.el-collapse >>> .el-collapse-item__header {
  border-bottom: 1px solid #cccc;
  height: 54px;
}

.el-collapse {
  border-top: 1px solid #cccc;
}

.el-collapse >>> .el-collapse-item__content {
  border-bottom: 1px solid #cccc;
  padding: 20px;
}

.calendar {
  margin-top: 30px;
}

.calendar_div {
  width: 80%;
}

.calendar_p {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  margin-top: 20px;
  margin-bottom: 30px;
}

.calendar_p2 {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  margin-top: 130px;
  margin-bottom: 0;
}

.van-calendar {
  width: 90%;
  margin: auto;
  border-radius: 10px;
  box-shadow: 0px 0px 20px 0px rgba(42, 59, 77, 0.2);
}

.choice {
  margin-top: 30px;
  overflow-y: scroll;
  height: 520px;
}

.choice::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 6px;
  /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}

.choice::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #00e467;
}

.choice::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: #ededed;
}

.van-cell {
  font-size: 18px !important;
  font-weight: 700;
  color: #323e48;
  border-radius: 100px;
  /* box-shadow: 0px 0px 6px 0px rgba(207, 13, 13, 0.185); */
  width: 90%;
  height: 48px;
  margin: 0 auto;
  margin-top: 30px;
  background: linear-gradient(90deg, #36ff94 0%, #00e467 100%);
}

.van-cell__value {
  font-size: 16px;
  color: #323e48;
}

.time-button {
  text-align: center;
}

.list-item {
  font-size: 19px;
  font-family: "Comfortaa-Bold";
  width: 70%;
  padding: 11px 0 13px 0;
  /* height: 48px; */
  border: 1px solid #dddddd;
  margin-bottom: 12px;
  background: #ffffff;
  border-radius: 100px;
  /* box-shadow: 0px 0px 6px 0px rgba(42, 59, 77, 0.2); */
}

.list-item_span {
  font-size: 18px;
}

.nextStep {
  text-align: center;
}

.nextStep > button {
  width: 30%;
  padding: 11px 0 11px 0;
  font-size: 21px;
  border: none;
  margin-top: 70px;
  margin-bottom: 30px;
  font-weight: 700;
  background: #00e467;
  border-radius: 0px 10px 0px 0px;
}

.el-notification {
  width: 90% !important;
}

.van-calendar >>> .van-calendar__header-title {
  height: 44px;
  padding-top: 10px;
}

.van-popup >>> .van-calendar__confirm {
  width: 90%;
  margin: 0 auto 30px auto;
  height: 42px;
}

.van-popup >>> .van-calendar__header-title {
  height: 44px;
  padding-top: 10px;
}

.input {
  text-align: center;
}

.input_name {
  width: 60%;
  margin: 30px auto;
  display: flex;
  align-items: center;
}

.input_span {
  /* font-weight: 700; */
  font-size: 19px;
  margin-right: 30px;
  width: 110px;
}

.input_span_2 {
  width: 135px;
}

.el-input >>> .el-input__inner {
  border: 1px solid #cacaca;
  border-radius: 10px;
  height: 44px;
}

.subscription {
  display: flex;
  margin: auto;
  width: 90%;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 30px;
}

.subscription_span {
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  /* font-family: "GenSenMaruGothicTW-Bold"; */
}

.van-checkbox >>> .van-checkbox__icon {
  font-size: 20px;
}

.van-checkbox {
  align-items: flex-start;
  margin: 5px 20px 5px 0;
}

.input_button {
  width: 25%;
  font-size: 20px;
  font-weight: 700;
  padding: 12px 0;
  margin-bottom: 10px;
  color: #fff;
  border: none;
  background: #05b26b;
  font-family: "Comfortaa-Regular";
  border-radius: 50px;
}

.van-radio-group--horizontal {
  /* margin: 0 auto; */
  width: 100%;
  /* margin-top: 20px; */
  /* border: 2px solid #00e467; */
  /* border-radius: 10px; */
  /* padding: 12px 16px; */
  font-size: 17px;
  background-color: #fff;
  /* font-weight: 700; */
}

.characteristic {
  color: #bcbfc2;
  font-size: 14px;
  line-height: 22px;
  margin-right: 50%;
  margin-bottom: 10px;
}

/* .van-checkbox-group {
  margin: 0 auto;
  width: 40%;
  margin-top: 20px;
  border: 2px solid #00e467;
  border-radius: 10px;
  padding: 12px 10px;
  font-size: 16px;
  background-color: #fff;
  font-weight: 700;
} */

.el-select {
  width: 220px;
  margin-right: 20px;
}

.el-select >>> .el-input__inner {
  /* border: none !important; */
  /* padding: 0 0 0 38px !important; */
  height: 44px;
  margin-right: 10px;
  border-radius: 10px;
}

.hint {
  width: 60%;
  margin: auto;
  font-size: 15px;
  margin-top: 25px;
  text-align: left;
  margin-bottom: 70px;
  color: #949494;
}

.van-cell >>> .van-field__label {
  margin-right: 0;
}

.van-radio--horizontal {
  margin: 5px 20px 5px 0;
}

.el-collapse >>> .el-collapse-item__header {
  font-size: 16px;
}

.customers {
  margin-bottom: 120px;
}

.customers_img {
  width: 100%;
}

.el-dialog__wrapper >>> .el-dialog__title {
  font-size: 24px;
  font-weight: 900;
}

.el-dialog__wrapper >>> .el-dialog__header {
  padding-top: 40px;
}

.el-button--primary {
  background-color: #00e467;
  border-color: #00e467;
}

.el-dialog__wrapper >>> .el-dialog {
  width: 60%;
}

.Bottom {
  padding: 30px 0;
  background-color: #323e48;
}

.Bottom_div {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  padding: 0 3%;
}

.Bottom_p {
  color: #fff;
  margin: 0;
}

.Bottom_img {
  width: 130px;
}

.Bottom_Kindly {
  padding: 40px 10%;
  text-align: left;
  background-color: #f5f5f5;
}

.Bottom_Kindly > p {
  margin-bottom: 1px;
}

.trim_img {
  width: 100%;
}

.evaluate {
  text-align: center;
  margin: auto;
}

.evaluate_div {
  margin: auto;
  width: 90%;
  background: #ffffff;
  border: 1px solid #00e467;
  border-radius: 40px;
  margin-bottom: 50px;
}

.evaluate_img {
  width: 140px;
  margin: 10px 30px;
}

.evaluate_h2 {
  font-size: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 120px 0 30px 0;
}
.evaluate_h3 {
  font-size: 26px;
  margin-bottom: 50px;
}

.process_h2_1 {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-size: 40px;
  margin: 100px 0 30px 0;
}

.process_h3_1 {
  font-size: 32px;
  padding: 4px 0 2px 0;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 0, 0),
    #94e7bf,
    #29cf7e,
    #94e7bf,
    rgba(0, 255, 0, 0)
  );
  width: 40%;
  text-align: center;
  margin: 0 auto 60px auto;
}

.process_h2_2 {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-size: 40px;
  margin-bottom: 30px;
}

.process_h3_2 {
  font-size: 32px;
  padding: 4px 0 2px 0;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 0, 0),
    #94e7bf,
    #29cf7e,
    #94e7bf,
    rgba(0, 255, 0, 0)
  );
  width: 40%;
  text-align: center;
  margin: 0 auto 60px auto;
}

.process_h2 {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-size: 40px;
  margin-bottom: 30px;
}

.process_h3 {
  font-size: 32px;
  padding: 2px 0 0;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 0, 0),
    #94e7bf,
    #29cf7e,
    #94e7bf,
    rgba(0, 255, 0, 0)
  );
  width: 40%;
  text-align: center;
  margin: 0 auto 60px auto;
}

.video {
  text-align: center;
}

.video_div {
  height: 700px;
}

.video_h2 {
  font-size: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 60px;
}

.star {
  width: 32px;
  margin: 0 10px;
}

.promotion {
  display: flex;
  justify-content: center;
  align-items: center;
}

.promotion_left {
  /* width: 30%; */
  padding: 0 5% 0 15%;
}

.promotion_step {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  margin-bottom: 30px;
}

.promotion_img {
  width: 60%;
  margin-bottom: 30px;
  aspect-ratio: 458 / 452;
  object-fit: cover;
}

.promotion_left_img {
  width: 60%;
}

.promotion_left_div {
  text-align: center;
}

.promotion_left_h3 {
  font-size: 24px;
  margin: 0 0 5px 0;
}

.promotion_left_p {
  font-size: 16px;
  margin: 0 0 5px 0;
}

.scheme {
  text-align: center;
}

.Price_h2_3 {
  font-size: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 30px;
}

.Price_h3_2 {
  font-size: 32px;
  padding: 2px 0 0;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 0, 0),
    #94e7bf,
    #29cf7e,
    #94e7bf,
    rgba(0, 255, 0, 0)
  );
  width: 40%;
  text-align: center;
  margin: 0 auto 40px auto;
}

.WordWeight {
  /* font-weight: 600; */
  font-size: 24px;
}
.move_img {
  width: 100%;
}

table {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 25px;
  border: none;
  border: 1px solid #b3f1d8;
  width: 70%;
  margin: 0 auto 60px auto;
  /* font-weight: 600; */
  /* background: url(https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/hospital_21.png)
    no-repeat bottom right; */
  /* background-repeat: no-repeat bottom right;
            background-size: 100%; */
}

.gradient1 {
  border-radius: 25px 0 0 0;
  border-right: 1px solid #fff;
  background: linear-gradient(to right, #00cd7c, #00b76e);
}
.gradient2 {
  background: linear-gradient(to right, #00b76e, #02a563);
}
.gradient3 {
  background: linear-gradient(to right, #02a563, #019258);
}
.gradient4 {
  background: linear-gradient(to right, #019258, #017d4b);
}
.gradient5 {
  background: linear-gradient(to right, #017d4b, #01693f);
}
.Pricebackground1 {
  background-color: #ebfbf1;
}
.Pricebackground2 {
  background-color: #c2f2d4;
}
.Pricebackground3 {
  background-color: #a3ecbe;
}
.Pricebackground4 {
  background-color: #85e6a9;
}
th {
  background-color: #00ce7c;
  text-align: center;
  padding: 10px 10px;
  border: 1px solid #b3f1d8;
  color: #fff;
  font-size: 26px;
}

td {
  text-align: center;
  padding: 20px 10px;
  border: 1px solid #75dca2;
  /* color: #3bb375; */
  font-size: 24px;
}
/* .service {
  background-color: #00ce7c;
  color: #fff;
  font-weight: 600;
} */
td:last-child,
th:last-child {
  border-right-color: transparent;
}
.el-icon-success {
  font-size: 26px;
}
.el-icon-error {
  font-size: 26px;
}
.td_p {
  text-decoration: line-through;
  font-size: 16px;
  margin: 0;
}
.td_background {
  background-color: #eeeeee;
}

.scheme_button {
  width: 25%;
  /* height: 30px; */
  padding: 10px;
  border: 0 none;
  color: #fff;
  font-family: "Comfortaa-Regular";
  font-weight: 700;
  font-size: 20px;
  border-radius: 50px;
  margin: 0 0 120px 0;
  background: #05b26b;
  border: none;
}
.Consultant {
  text-align: center;
  width: 70%;
  margin: 120px auto 0 auto;
}
.Consultant_div {
  margin-bottom: 80px;
}
.Consultant_h3 {
  font-size: 26px;
  margin-top: 20px;
}
.Consultant_img {
  width: 80%;
  aspect-ratio: 336 / 336;
  object-fit: cover;
}

.advantage_div {
  width: 90%;
  margin: 0px auto 80px auto;
  text-align: center;
}
.advantage_div_2 {
  margin-bottom: 60px;
}
.advantage_img {
  width: 90%;
}
.advantage_h3 {
  /* margin-top: 30px; */
  font-size: 24px;
}

.advantage_p {
  font-size: 16px;
}
.CaseStudy {
  position: absolute;
  top: 20%;
  left: 10%;
}
.CaseStudy_div {
  margin-bottom: 0px;
}
.Price_h3 {
  font-size: 30px;
  margin-top: 50px;
}
.Price_h2_2 {
  font-size: 50px;
}
.Price_p {
  font-size: 18px;
}
.Price_h3_1 {
  font-size: 36px;
}
.Heavyhoop_h2 {
  font-size: 58px;
  color: #00ce7c;
}
.Heavyhoop_h3 {
  font-size: 34px;
  margin-bottom: 15px;
}
.Heavyhoop_h2_2 {
  font-size: 32px;
  margin-bottom: 40px;
}
.Heavyhoop_p {
  font-size: 20px;
}
.Heavyhoop {
  position: absolute;
  top: 25%;
  right: 15%;
}
.gift {
  padding: 50px 0;
  background-color: #d3f5e5;
}
.gift_div {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80%;
  margin: 0 auto;
}
.gift_div_2 {
  width: 55%;
}
.gift_img {
  width: 40%;
}
.process_h2_4 {
  font-size: 48px;
  border-bottom: 2px solid #8ca4a0;
  padding-bottom: 22px;
  margin-bottom: 60px;
  margin-right: 10%;
}

.process_h3_4 {
  font-size: 34px;
  margin-bottom: 20px;
}
.gift_p {
  font-size: 18px;
  margin-bottom: 20px;
}
.address {
  width: 50%;
  position: absolute;
  top: 160px;
  left: 10%;
}
.address_button {
  width: 50%;
  padding: 12px;
  border: 0 none;
  color: #2be178;
  font-family: "Comfortaa-Regular";
  font-weight: 700;
  font-size: 22px;
  border-radius: 50px;
  margin: 30px 0 0px 0;
  background: #000;
  border: none;
}
.address_h2 {
  font-size: 56px;
}

.address_h3 {
  margin: 20px 0;
  font-size: 52px;
}
.StoreLocation {
  width: 100%;
  position: absolute;
  top: 200px;
  text-align: center;
}

.StoreLocation_h2 {
  font-size: 66px;
  color: #fff;
  margin-bottom: 30px;
}
.StoreLocation-p {
  font-size: 22px;
  color: #fff;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  text-align: center;
  justify-content: center;
}
.StoreLocation-p img {
  width: 32px;
  margin-right: 5px;
}
.team {
  position: absolute;
  bottom: 260px;
  right: 20%;
  text-align: left;
}

.team_h2 {
  font-size: 66px;
  margin-bottom: 0px;
  color: #00ce7c;
}

.team_h3 {
  font-size: 40px;
  margin-bottom: 40px;
  color: #fff;
}

.team_p {
  font-size: 22px;
  color: #fff;
}
.layout {
  padding: 50px 0;
  position: relative;
  text-align: center;
}
.BraceTeeth {
  height: 340px;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  /* 背景图保持原始比例，尽可能大地显示在元素中 */
  background-image: url("https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/sz-dental_21.png?x-oss-process=image/resize,w_800/format,webp");
  text-align: left;
  padding: 60px 100px;
}

.BraceTeeth_2 {
  height: 340px;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  /* 背景图保持原始比例，尽可能大地显示在元素中 */
  background-image: url("https://beame.oss-cn-hongkong.aliyuncs.com/mobilePicture/children_9.png?x-oss-process=image/resize,w_1500/format,webp");
  text-align: left;
  padding: 60px 100px;
}

.BraceTeeth_h2 {
  /* margin-top: 100px; */
  font-size: 36px;
}

.BraceTeeth_p {
  margin: 40px 0;
  font-size: 18px;
}

.BraceTeeth_h2_2 {
  /* margin-top: 100px; */
  font-size: 36px;
  color: #fff;
}

.BraceTeeth_p_2 {
  margin: 15px 0;
  font-size: 18px;
  color: #fff;
}

.BraceTeeth_button {
  color: #fff;
  border-radius: 50px;
  border: none;
  padding: 6px 50px;
  margin-bottom: 30px;
  background-color: #00ce7c;
  font-size: 20px;
  font-weight: 700;
}
.service3_h2 {
  margin: 100px auto 15px auto;
  font-size: 45px;
  text-align: center;
}
.advisory {
  position: relative;
  margin: 50px auto 80px auto;
  display: flex;
  justify-content: center;
}

.box {
  margin: 0px 30px;
  width: 618px;
  height: 358px;
  transform: scale(1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: 100% 100%;
}
.box3 {
  margin: 0px auto;
  width: 1300px;
  height: 468px;
  transform: scale(1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: 100% 100%;
}

.box-hover {
  transform: scale(1.2);
}

.box-shrink {
  transform: scale(0.9);
}
.box2-hover {
  transform: scale(1.1);
}

.box2-shrink {
  transform: scale(0.9);
}
.title {
  font-size: 50px;
  color: #fff;
  text-shadow: 0 0 8px #05b26b;
}
.box_text {
  position: absolute;
  top: 0;
  left: 5px;
  width: 610px;
  height: 350px;
  color: rgb(0, 0, 0);
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.4);
  align-items: center;
  justify-content: center;
  opacity: 0;
  border-radius: 40px;
  transition: opacity 0.1s ease, visibility 0.3s ease;
  visibility: hidden; /* 初始状态设置为不可见 */
  cursor: pointer;
}

.box_text.visible {
  opacity: 1;
  visibility: visible; /* 鼠标悬停时设置为可见 */
}
.box_text3 {
  position: absolute;
  top: 0;
  left: 0px;
  width: 100%;
  height: 100%;
  color: rgb(0, 0, 0);
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.4);
  align-items: center;
  justify-content: center;
  opacity: 0;
  border-radius: 50px;
  transition: opacity 0.1s ease, visibility 0.3s ease;
  visibility: hidden; /* 初始状态设置为不可见 */
  cursor: pointer;
}

.box_text3.visible {
  opacity: 1;
  visibility: visible; /* 鼠标悬停时设置为可见 */
}
.pp {
  color: #fff;
  padding: 0 10%;
  font-size: 30px;
}
.pp2 {
  color: #fff;
  padding: 10px 5%;
  font-size: 20px;
  text-align: center;
}
.box_btn {
  color: #fff;
  background-color: #00e467;
  border-radius: 50px;
  border: none;
  font-size: 18px;
  padding: 5px 60px;
  font-family: "GenSenMaruGothicTW-Medium";
}

.free {
  text-align: center;
  padding: 120px 0 30px 0;
}
.free-title {
  font-size: 40px;
  margin-bottom: 20px;
}
.free-tags {
  font-size: 26px;
  margin: 0 0 40px 0;
}
.free-div {
  width: 60%;
  margin: 30px auto;
  font-size: 20px;
  padding: 30px;
  border-radius: 20px;
  background-color: #d9fbe8;
}
.free-container {
  width: 80%;
  margin: 0 auto;
  display: flex;
  justify-content: space-evenly;
}
.free-content {
  margin: 0 20px;
}
.free-content h3 {
  font-size: 26px;
  margin: 5px 0 20px 0;
  color: #00e467;
}

.free-content p {
  font-size: 18px;
  padding: 0 5%;
}
.td-span {
  font-size: 18px;
}
.feedback {
  width: 70%;
  margin: 0px auto;
}
.feedback-h2 {
  font-size: 40px;
  text-align: center;
  margin: 100px 0 40px 0;
}
.feedback-div {
  width: 60%;
  margin: 20px auto;
  /* padding: 50px 50px; */
  text-align: center;
  background: #ffffff;
  box-shadow: 0 0 8px 4px rgba(89, 115, 121, 0.1);
  border-radius: 17px 17px 17px 17px;
  height: 360px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.feedback-left {
  width: 50%;
  text-align: left;
  padding: 50px 0 20px 40px;
}
.feedback-right {
  width: 50%;
}
.feedback-icon {
  width: 100%;
  /* height: 100%; */
  padding-right: 20px;
  aspect-ratio: 357 / 352;
  object-fit: cover;
}
.feedback-icon1 {
  width: 90%;
  /* height: 100%; */
  margin-top: 20px;
  padding-right: 20px;
  aspect-ratio: 321 / 301;
  object-fit: cover;
}
.feedback-name {
  margin: 10px 0 20px 0;
  font-size: 30px;
  line-height: 42px;
}
.feedback-name-span {
  font-size: 26px;
  font-family: "GenSenMaruGothicTW-Bold";
}
.feedback-time {
  font-size: 17px;
  margin-bottom: 30px;
}
.feedback-button {
  width: 80%;
  margin-right: 70px;
  font-size: 20px;
  text-align: center;
  padding: 7px 0;
  color: #fff;
  border: none;
  background: #00e467;
  font-family: "GenSenMaruGothicTW-Regular";
  border-radius: 50px;
}
.feedback-star {
  width: 100px;
  margin: 0 0 16px 0;
}
.feedback-photo {
  width: 80px;
  border-radius: 50px;
}

.el-carousel >>> .el-carousel__indicator--horizontal button {
  width: 12px;
  height: 12px;
  background: #949494;
  border-radius: 50%;
  opacity: 0.5;
}

.el-carousel >>> .el-carousel__indicator--horizontal.is-active button {
  width: 12px;
  height: 12px;
  background: #05b26b;
  opacity: 1;
  border-radius: 10px;
}
.table—color {
  background-color: #eeeeee;
}

.service {
  font-size: 19px;
  text-align: left;
  margin-right: 10px;
}
.service_p {
  margin: 10px 0 0 10%;
}
.service_sp {
  font-family: "GenSenMaruGothicTW-Bold";
}

.van-checkbox {
  margin: 5px 10px;
}

.service_div {
  width: 60%;
  margin: 15px auto;
  display: flex;
  flex-direction: column;
}

.van-checkbox-group {
  margin: 0 auto;
  width: 100%;
  padding: 12px 0px 12px 12%;
  font-size: 17px;
  background-color: #fff;
}

h1,
h2,
h3,
h4,
h5,
button,
a {
  font-family: "GenSenMaruGothicTW-Bold";
}

p,
span,
div {
  font-family: "GenSenMaruGothicTW-Regular";
}

@media all and (min-width: 2000px) {
  .computer_h1 {
    font-size: 98px;
  }
  .computer_h2 {
    font-size: 38px;
  }
  .computer_p {
    font-size: 26px;
  }

  .deta_button_3 {
    font-size: 26px;
  }

  .move_img_3 {
    width: 35%;
  }
  .video_div {
    height: 800px;
  }
}

@media all and (min-width: 1800px) {
  .container-xl {
    max-width: 1700px !important;
  }
  .computer_h1 {
    font-size: 90px;
  }
  .computer_h2 {
    font-size: 36px;
  }
  .computer_p {
    font-size: 24px;
  }
  .deta_button_3 {
    width: 20%;
  }
}

@media all and (min-width: 1600px) {
  .container-xl {
    max-width: 1520px;
  }
  .address {
    top: 100px;
    left: 10%;
  }
}

@media all and (max-width: 1600px) {
  .deta_div {
    /* width: 24%; */
    margin-right: 30px;
    margin-bottom: 30px;
  }

  .deta_button {
    width: 50%;
  }

  .deta_div_2 {
    width: 60%;
  }

  .nav-link {
    font-size: 15px;
  }

  .computer_h1 {
    font-size: 60px;
  }

  .computer_p {
    font-size: 22px;
    margin: 36px 0;
  }

  .computer_span_1 {
    font-size: 36px;
  }

  .computer_span_2 {
    font-size: 22px;
  }

  .computer_div {
    top: 18%;
  }

  .shop_div {
    display: block;
  }

  .van-collapse {
    width: 100%;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 280px !important;
  } */

  .deta_h3 {
    margin-top: 10px;
    margin-bottom: 26px;
  }
  .BraceTeeth_2 {
    padding: 60px 60px;
  }

  .BraceTeeth {
    padding: 60px 60px;
  }
  .promotion_left {
    width: 50%;
    padding: 0px 0 0 10%;
  }
  .promotion_img {
    width: 60%;
    margin-left: 15%;
  }
  .advantage_div {
    width: 100%;
  }
  .Heavyhoop {
    right: 15%;
  }
  .address {
    top: 90px;
  }
  .video_div {
    height: 680px;
  }
  .gift_div_2 {
    width: 60%;
  }
  .gift_div {
    width: 85%;
  }
}

@media all and (max-width: 1400px) {
  .superiority_table {
    width: 100%;
  }

  .navbar-dark .navbar-toggler-icon {
    background-image: url(@/img/buttonicon2x.png);
  }

  .deta_div {
    /* width: 40%; */
    margin-right: 20px;
    margin-bottom: 30px;
  }

  .clinic-img {
    width: 180px;
  }

  .deta_p {
    font-size: 16px;
    margin: 0px 0 12px 0;
  }

  .deta_p > img {
    width: 26px;
    height: 26px;
  }

  .prove2 > img {
    width: 70%;
  }

  .prove1 > img {
    margin-top: 30px;
  }

  .deta_button_3 {
    width: 35%;
    font-size: 16px;
  }

  .move_img_3 {
    width: 50%;
  }

  .computer_h1 {
    font-size: 56px;
  }

  .computer_p {
    font-size: 20px;
    margin: 26px 0;
  }

  .computer_span_2 {
    font-size: 20px;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 220px !important;
  } */
  .advantage_2 {
    width: 100%;
  }

  .process_h2_1 {
    top: 65px;
    font-size: 40px;
  }

  .process_h3_1 {
    top: 141px;
    font-size: 30px;
  }

  .Price_h2_3 {
    top: 130px;
    font-size: 40px;
  }

  .Price_h3_2 {
    top: 205px;
    font-size: 32px;
  }

  .process_h2_2 {
    top: 112px;
    font-size: 40px;
  }

  .process_h3_2 {
    top: 178px;
    font-size: 32px;
  }

  .process_h2 {
    top: 162px;
    font-size: 40px;
  }

  .process_h3 {
    top: 228px;
    font-size: 30px;
  }

  .Price_h3 {
    top: 618px;
    font-size: 32px;
  }

  .evaluate_p_1 {
    font-size: 42px;
  }

  .process_h2_3 {
    top: 180px;
    right: 200px;
    font-size: 42px;
  }

  .process_h3_3 {
    top: 240px;
    right: 235px;
    font-size: 28px;
  }

  .img_button_5 {
    right: 235px;
  }

  .img_button {
    bottom: 100px;
    left: 60px;
  }

  .process_h2_4 {
    font-size: 42px;
  }

  .process_h3_4 {
    top: 360px;
    left: 90px;
    font-size: 30px;
  }
  .advantage_h3 {
    font-size: 22px;
  }
  .team {
    position: absolute;

    right: 15%;
  }

  .team_h2 {
    font-size: 58px;
  }

  .StoreLocation_h2 {
    font-size: 58px;
  }

  .StoreLocation {
    top: 140px;
  }
  .BraceTeeth {
    padding: 40px;
    padding: 30px 45px;
  }

  .BraceTeeth_2 {
    padding: 40px;
    padding: 30px 45px;
  }

  .BraceTeeth_h2_2 {
    margin-top: 35px;
    font-size: 28px;
  }

  .BraceTeeth_h2 {
    margin-top: 35px;
    font-size: 28px;
  }

  .BraceTeeth_p {
    margin: 20px 0 40px 0;
    font-size: 15px;
  }

  .BraceTeeth_p_2 {
    margin: 15px 0 25px 0;
    font-size: 15px;
  }
  .promotion_img {
    width: 70%;
  }
  .Price_h2_2 {
    font-size: 42px;
  }
  .Price_h3 {
    font-size: 30px;
  }
  .CaseStudy {
    top: 10%;
  }
  .Heavyhoop_h2 {
    font-size: 50px;
  }
  .Heavyhoop {
    top: 22%;
  }
  .process_h2_4 {
    font-size: 40px;
  }
  .gift_img {
    width: 45%;
  }
  .address_h2 {
    font-size: 42px;
  }
  .address_h3 {
    font-size: 40px;
  }
  .video_div {
    height: 600px;
  }
  .advantage_h2 {
    font-size: 40px;
  }
  .gift_div {
    width: 90%;
  }
  .box {
    margin: 0px 20px;
    width: 548px;
    height: 288px;
  }

  .box3 {
    margin: 0px auto;
    width: 1120px;
    height: 408px;
  }
  .title {
    font-size: 42px;
  }
  .box_text {
    top: 0;
    left: 4px;
    width: 541px;
    height: 283px;
    border-radius: 32px;
  }
  .pp {
    padding: 0 10%;
    font-size: 25px;
  }
  .pp2 {
    padding: 10px 5%;
    font-size: 18px;
  }
  .free-container {
    width: 100%;
  }
  .free {
    padding: 100px 0 10px 0;
  }
  .feedback-div {
    width: 75%;
  }
}

@media all and (max-width: 1200px) {
  .prove1 > h3 {
    font-size: 32px;
    font-weight: 600;
  }

  .computer_h1 {
    font-size: 52px;
  }
  .computer_h2 {
    font-size: 28px;
  }
  .computer_p {
    font-size: 18px;
    margin: 25px 0;
  }

  .computer_span_1 {
    font-size: 28px;
  }

  .computer_span_2 {
    font-size: 18px;
  }

  .deta_button_3 {
    width: 35%;
    font-size: 14px;
  }

  .el-dialog__wrapper >>> .el-dialog {
    width: 70%;
  }

  .dropdown_Book {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .process_h2_1 {
    top: 66px;
    font-size: 34px;
  }

  .process_h3_1 {
    top: 135px;
    font-size: 26px;
  }

  .Price_h2_3 {
    top: 127px;
    font-size: 34px;
  }

  .Price_h3_2 {
    top: 195px;
    font-size: 26px;
  }

  .process_h2_2 {
    top: 109px;
    font-size: 34px;
  }

  .process_h3_2 {
    top: 172px;
    font-size: 26px;
  }

  .process_h2 {
    top: 156px;
    font-size: 34px;
  }

  .process_h3 {
    top: 218px;
    font-size: 26px;
  }

  .Price_h3 {
    font-size: 26px;
    margin-top: 30px;
  }

  .Price_h3_1 {
    font-size: 26px;
  }

  .Price_h2_2 {
    font-size: 34px;
  }

  .process_h2_3 {
    top: 160px;
    right: 200px;
    font-size: 38px;
  }

  .process_h3_3 {
    top: 220px;
    right: 225px;
    font-size: 26px;
  }

  .img_button_5 {
    right: 230px;
    width: 20%;
  }

  .process_h2_4 {
    font-size: 36px;
  }

  .process_h3_4 {
    top: 340px;
    left: 80px;
    font-size: 28px;
  }
  .address {
    top: 80px;
    left: 10%;
  }
  .team {
    bottom: 140px;
    right: 15%;
  }

  .team_h2 {
    font-size: 48px;
  }
  .team_h3 {
    font-size: 36px;
  }
  .StoreLocation {
    top: 110px;
  }

  .StoreLocation_h2 {
    font-size: 48px;
  }
  .Consultant_img {
    width: 100%;
  }
  .CaseStudy {
    left: 5%;
  }
  td {
    font-size: 22px;
  }
  .Heavyhoop {
    top: 20%;
    right: 10%;
  }
  .Heavyhoop_h2_2 {
    margin-bottom: 30px;
  }
  .evaluate_h2 {
    font-size: 34px;
  }
  .star {
    width: 26px;
  }
  .address_h2 {
    font-size: 38px;
  }
  .address_h3 {
    font-size: 36px;
  }
  .address_button {
    font-size: 20px;
    margin: 10px 0 0px 0;
  }
  .calendar_div {
    width: 95%;
  }
  .video_div {
    height: 560px;
  }
  .scheme_button {
    width: 30%;
  }
  .advantage_h2 {
    font-size: 38px;
  }
  .video_h2 {
    font-size: 34px;
  }
  .box {
    margin: 0px 20px;
    width: 488px;
    height: 288px;
  }
  .box3 {
    margin: 0px auto;
    width: 1020px;
    height: 408px;
  }
  .box-hover {
    transform: scale(1.1);
  }
  .box2-hover {
    transform: scale(1.1);
  }
  .title {
    font-size: 40px;
  }
  .box_text {
    top: 0;
    left: 4px;
    width: 541px;
    height: 283px;
    border-radius: 32px;
  }
  .pp {
    padding: 0 10%;
    font-size: 25px;
  }
  .pp2 {
    padding: 10px 5%;
    font-size: 18px;
  }
  .feedback-div {
    width: 85%;
  }
  .service_div {
    width: 70%;
  }
}
@media all and (max-width: 1100px) {
  .box {
    margin: 0px 10px;
    width: 465px;
  }
  .box3 {
    margin: 0px auto;
    width: 948px;
    height: 328px;
  }
  .box-hover {
    transform: scale(1.1);
  }
  .pp {
    padding: 0 10%;
    font-size: 25px;
  }
  .pp2 {
    padding: 10px 5%;
    font-size: 18px;
  }
  .title {
    font-size: 40px;
  }
  .box_text {
    top: 0;
    left: 4px;
    width: 469px;
    border-radius: 32px;
  }
  .feedback-div {
    width: 98%;
  }
}
@media all and (max-width: 992px) {
  .deta {
    width: 100%;
    margin-left: 5%;
  }

  .deta > button {
    width: 30%;
  }

  .deta > img {
    width: 30%;
  }

  .waist_button {
    margin-bottom: 80px;
  }

  .team_img {
    width: 50%;
  }

  .prove1 > h3 {
    font-size: 28px;
  }

  .prove2 > img {
    width: 85%;
  }

  .evaluate_p {
    font-size: 14px;
  }

  .evaluate_p_1 {
    font-size: 14px;
  }

  .superiority_table {
    width: 80%;
    margin: 0 auto;
    margin-top: 30px;
  }

  .journey-img > img {
    display: none;
  }

  .journey-h3 > h2 {
    margin-left: 0;
    text-align: center;
  }

  .announcement-bar__message {
    width: 100%;
    padding-right: 0;
  }

  .shop {
    padding: 70px 20px;
  }

  .deta_div {
    width: 30%;
  }

  .deta_h3 {
    font-size: 26px;
    margin-top: 20px;
    margin-bottom: 15px;
  }

  .deta_p {
    margin: 0px 0 10px 0;
    font-size: 18px;
  }

  .move_img {
    width: 100%;
    /* 添加 animation-delay 属性来设置延迟时间 */
    animation: fade-in-and-scale 2s cubic-bezier(0.39, 0.575, 0.565, 1) forwards
      1s;
    /* 注意：在上面的行中，'forwards 1' 应该是 'forwards' 并且延迟应该单独作为一个参数 */
    /* 正确的写法如下 */
    animation: fade-in-and-scale 2s cubic-bezier(0.39, 0.575, 0.565, 1) forwards;
    /* animation-delay: 0.5s; 这里设置延迟时间 */
  }

  @keyframes fade-in-and-scale {
    0% {
      /* 开始时图片在Z轴上移动，透明度为0，并且放大到1.5倍 */
      transform: translateZ(80px) scale(1.5);
      opacity: 0;
    }

    100% {
      /* 结束时图片在Z轴上无移动，透明度为1，并且缩放到原始大小 */
      transform: translateZ(0) scale(1);
      opacity: 1;
    }
  }

  .move_img_2 {
    width: 100%;
    padding: 0;
  }

  .computer_h1 {
    font-size: 46px;
  }
  .computer_h2 {
    font-size: 24px;
  }
  .computer_p {
    font-size: 16px;
    margin: 25px 0;
  }

  .computer_span_1 {
    font-size: 24px;
  }

  .computer_span_2 {
    font-size: 18px;
  }

  .deta_button_3 {
    width: 30%;

    font-size: 14px;
  }

  .pc {
    display: block;
  }

  .move {
    display: none;
  }

  .van-cell {
    width: 70%;
  }

  .list-item {
    width: 70%;
  }

  .choice {
    margin-top: 30px;
    /* height: 100%; */
    padding-bottom: 5px;
    height: 420px;
    padding: 0;
    width: 90%;
    margin: 30px auto;
  }

  /* .choice::-webkit-scrollbar {

    display: none;
  }  */
  .nextStep > button {
    width: 60%;
    font-size: 18px;
  }

  .input_name {
    width: 70%;
  }

  .el-dialog__wrapper >>> .el-dialog {
    width: 80%;
  }

  .van-checkbox >>> .van-checkbox__label {
    margin-left: 1px;
    font-size: 14px;
  }

  .input_button {
    width: 40%;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 200px !important;
  } */

  .deta_div {
    width: 40%;
  }

  .calendar_div {
    width: 100%;
  }

  .waist_button {
    width: 35%;
  }

  .computer_div {
    top: 10%;
  }

  .process_h2 {
    top: 137px;
    font-size: 32px;
  }

  .process_h2_1 {
    top: 55px;
    font-size: 32px;
  }

  .process_h3_1 {
    top: 120px;
    font-size: 24px;
  }

  .Price_h2_3 {
    top: 112px;
    font-size: 32px;
  }

  .Price_h3_2 {
    top: 174px;
    font-size: 24px;
  }

  .process_h2_2 {
    top: 96px;
    font-size: 32px;
  }

  .process_h3_2 {
    top: 152px;
    font-size: 24px;
  }

  .process_h2 {
    top: 137px;
    font-size: 32px;
  }

  .process_h3 {
    top: 194px;
    font-size: 24px;
  }

  .Price_h3 {
    top: 521px;
    font-size: 24px;
  }

  .Price_h3_1 {
    top: 130px;
    left: 80px;
    font-size: 24px;
  }

  .Price_h2_2 {
    top: 90px;
    left: 80px;
    font-size: 32px;
  }

  .process_h2_3 {
    top: 150px;
    right: 166px;
    font-size: 36px;
  }

  .process_h3_3 {
    top: 200px;
    right: 195px;
    font-size: 24px;
  }

  .process_h2_4 {
    font-size: 32px;
    padding-bottom: 15px;
    margin-bottom: 30px;
  }

  .process_h3_4 {
    font-size: 24px;
  }
  .gift_p {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .evaluate_h2 {
    font-size: 32px;
  }
  .evaluate_h3 {
    font-size: 22px;
  }
  .evaluate_img {
    width: 110px;
    margin: 10px 20px;
  }
  .address {
    top: 45px;
    left: 8%;
  }

  .address_2 {
    top: 60px;
    right: 8%;
  }
  .layout {
    padding: 20px 0;
  }
  .BraceTeeth {
    width: 60%;
    margin: 0 auto 30px auto;
    padding: 40px;

    background-repeat: no-repeat;
    /* 防止背景图重复 */
    background-size: cover;
    /* 背景图覆盖整个DIV，可能会裁剪部分图像 */
    background-position: center center;
    /* 背景图在DIV中居中显示 */
  }

  .BraceTeeth_2 {
    width: 60%;
    margin: 0 auto 0 auto;
    padding: 40px;
    background-repeat: no-repeat;
    /* 防止背景图重复 */
    background-size: cover;
    /* 背景图覆盖整个DIV，可能会裁剪部分图像 */
    background-position: center center;
    /* 背景图在DIV中居中显示 */
  }

  .BraceTeeth_h2_2 {
    margin-top: 35px;
    font-size: 30px;
  }

  .BraceTeeth_h2 {
    margin-top: 35px;
    font-size: 30px;
  }

  .BraceTeeth_p {
    margin: 20px 0 40px 0;
    font-size: 16px;
  }

  .BraceTeeth_p_2 {
    margin: 20px 0 40px 0;
    font-size: 16px;
  }
  .promotion_left_h3 {
    font-size: 20px;
  }
  .promotion_left {
    width: 60%;
    padding: 0px 0 0 5%;
  }
  .promotion_img {
    width: 75%;
    margin-left: 10%;
    margin-bottom: 25px;
  }
  .promotion_step {
    margin-bottom: 25px;
  }
  .video_div {
    height: 500px;
  }
  .customers {
    margin-bottom: 70px;
  }
  table {
    width: 90%;
  }
  .scheme_button {
    width: 40%;
  }
  .Price_p {
    font-size: 16px;
  }
  td {
    font-size: 20px;
  }
  th {
    font-size: 22px;
  }
  .el-icon-success {
    font-size: 24px;
  }
  .el-icon-error {
    font-size: 24px;
  }
  .Heavyhoop_h2 {
    font-size: 40px;
  }
  .Heavyhoop_h3 {
    font-size: 24px;
    margin-bottom: 10px;
  }
  .Heavyhoop_h2_2 {
    font-size: 26px;
    margin-bottom: 20px;
  }
  .Heavyhoop_p {
    font-size: 16px;
  }
  .address_h2 {
    font-size: 34px;
  }
  .address_h3 {
    font-size: 32px;
  }
  .StoreLocation_h2 {
    font-size: 42px;
  }
  .team_h2 {
    font-size: 42px;
  }
  .team_h3 {
    font-size: 30px;
  }
  .team_p {
    font-size: 18px;
    color: #fff;
  }
  .team {
    bottom: 100px;
    right: 12%;
  }
  .advantage_h2 {
    font-size: 32px;
  }
  .box {
    margin: 0px 7px;
    width: 410px;
  }
  .box3 {
    margin: 0px auto;
    width: 848px;
    height: 328px;
  }
  .box-hover {
    transform: scale(1.1);
  }
  .title {
    font-size: 32px;
  }
  .box_text {
    top: 0;
    left: 4px;
    width: 404px;
    border-radius: 32px;
  }
  .pp {
    padding: 0 10%;
    font-size: 18px;
  }
  .pp2 {
    padding: 0px 5%;
    font-size: 14px;
  }
}

@media all and (max-width: 800px) {
  .superiority_table {
    width: 90%;
    margin: 0 auto;
    margin-top: 30px;
  }

  .waist_button {
    width: 55%;
  }

  .waist_button_2 {
    width: 55%;
  }

  .move_img {
    margin-top: 0px;
  }

  .logo {
    width: 130px;
    /* height: 30px; */
    margin-left: 20px;
  }

  .announcement-bar__message_p {
    margin: 0px;
    font-size: 14px;
  }

  .shopify-section_img {
    width: 18px;
  }

  .shopify-section_mobile {
    display: flex;
    overflow: hidden;
    align-items: center;
    text-align: center;
    justify-content: space-around;
  }

  .announcement-bar__message_p {
    text-align: center;
    margin: 5px 0 0 0;
  }

  .computer {
    margin-top: 40px;
  }

  .navbar-brand {
    padding: 0;
  }

  /* .shopify-section {
    height: 80px;
  } */

  .deta_div {
    width: 35%;
    margin-right: 30px;
    margin-bottom: 30px;
  }

  .deta_h3 {
    font-size: 24px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .deta_p {
    font-size: 18px;
    margin: 0px 0 10px 0;
  }

  .deta_button {
    width: 80%;
    border: 0 none;
    color: #fff;
    font-size: 20px;
    border-radius: 50px;
    margin-top: 10px;
  }

  .Blooming_button {
    margin-bottom: 35px;
  }

  .shopify-section {
    height: 70px;
    padding: 5px 0;
  }

  .navbar {
    position: relative;
    display: flex;
    justify-content: flex-end;
    flex-direction: row-reverse;
    align-items: center;
  }

  .navbar-brand {
    margin-left: 30%;
  }

  .Blooming_p {
    padding: 0 6%;
  }

  /* .move {
    display: block;
  } */

  /* .computer {
    display: none;
  } */

  .computer_div {
    padding: 0 10px;
    width: 100%;
    top: 9%;
    left: 0;
  }

  .computer_h1 {
    font-size: 62px;
    /* color: #323e48; */
    /* text-align: left; */
    /* margin-left: 20px; */
  }
  .computer_h2 {
    font-size: 30px;
  }
  .computer_p {
    font-size: 20px;
    margin: 35px 0;
    color: #323e48;
    /* text-align: left; */
  }

  .computer_span_1 {
    font-size: 32px;
  }

  .computer_span_2 {
    font-size: 20px;
  }

  .deta_button_3 {
    width: 40%;
    margin-bottom: 20px;
    font-size: 20px;
  }

  .computer_div_2 {
    width: 100%;
    position: absolute;
    bottom: 180px;
    left: 50%;
    transform: translate(-50%);
    text-align: center;
  }

  .move_img_3 {
    width: 80%;
    text-align: center;
    margin-top: 0px;
  }

  .compare_2 {
    width: 75%;
  }

  .area {
    width: 70%;
  }

  .hint {
    width: 70%;
  }

  .input_name {
    width: 80%;
  }

  .van-calendar {
    width: 95%;
  }

  .move_p {
    text-align: center;
    font-size: 18px;
    margin: 40px 0 20px 0;
  }

  .van-calendar >>> .van-calendar__header {
    box-shadow: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .team_img {
    width: 80%;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 360px !important;
  } */

  .deta {
    margin-left: 0;
  }

  .clinic-img {
    width: 210px;
    margin-bottom: 0px;
  }

  .deta_div {
    margin-bottom: 0px;
  }

  .Bottom {
    padding: 30px 0;
  }

  .Bottom_p {
    text-align: left;
    font-size: 14px;
  }

  .Bottom_p1 {
    text-align: right;
    margin-top: 30px;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .Bottom_img {
    width: 160px;
    margin-bottom: 10px;
  }

  .compare_div_right {
    margin: 0;
  }

  .compare_div_left {
    margin: 0;
  }

  .process_h2_1 {
    top: 47px;
    font-size: 28px;
  }

  .process_h3_1 {
    top: 103px;
    font-size: 20px;
  }

  .process_h2 {
    top: 117px;
    font-size: 28px;
  }

  .process_h3 {
    top: 167px;
    font-size: 20px;
  }

  .Price_h2_3 {
    top: 97px;
    font-size: 28px;
  }

  .Price_h3_2 {
    top: 150px;
    font-size: 20px;
  }

  .process_h2_2 {
    top: 80px;
    font-size: 28px;
  }

  .process_h3_2 {
    width: 50%;
    font-size: 20px;
  }

  .Price_h3_1 {
    font-size: 24px;
  }

  .Price_h2_2 {
    font-size: 34px;
  }

  .Price_h3 {
    font-size: 24px;
  }
  .Price_p {
    font-size: 18px;
  }

  .process_h2_3 {
    top: 130px;
    right: 200px;
    font-size: 32px;
  }

  .process_h3_3 {
    top: 221px;
    right: 146px;
    font-size: 20px;
  }

  .process_h2_4 {
    font-size: 40px;
    padding-bottom: 35px;
    margin-bottom: 100px;
  }

  .process_h3_4 {
    font-size: 26px;
  }
  .gift_p {
    font-size: 18px;
    margin-bottom: 15px;
  }

  .star {
    display: none;
    width: 24px;
  }
  .advantage_h3 {
    margin-top: 5px;
  }
  .address {
    width: 50%;
    position: absolute;
    top: 100px;
    left: 10%;
  }

  .address_h2 {
    font-size: 48px;
  }

  .address_h3 {
    font-size: 32px;
  }
  .team {
    bottom: 60px;
  }

  .StoreLocation {
    top: 80px;
  }

  .team_h2 {
    font-size: 46px;
  }

  .team_h3 {
    font-size: 28px;
    margin-bottom: 30px;
  }

  .StoreLocation_h2 {
    font-size: 46px;
  }
  .BraceTeeth {
    width: 75%;
    background-size: contain;
  }

  .BraceTeeth_2 {
    width: 75%;
    background-size: contain;
  }
  .promotion {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column-reverse;
  }
  .promotion_img {
    width: 60%;
    margin-left: 0;
  }
  .promotion_div {
    text-align: center;
  }
  .promotion_left_img {
    width: 85%;
  }
  .promotion_left {
    width: 70%;
  }
  .promotion_left_img {
    width: 75%;
  }
  .promotion_left_h3 {
    font-size: 32px;
  }
  .promotion_left_p {
    font-size: 20px;
    margin: 0 0 5px 0;
  }
  .advantage {
    width: 90%;
    display: flex;
    justify-content: space-around;
  }

  .video_h2 {
    font-size: 30px;
  }
  .Consultant {
    width: 90%;
  }
  .Consultant_h3 {
    font-size: 22px;
  }
  .advantage_div_3 {
    margin-top: 50px;
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
  }

  .advantage_h3 {
    margin-top: 5px;
  }

  .step {
    padding: 8px 20px 30px 20px;
    border: 1px solid #00e467;
    margin: 10px 0 60px 0;
    border-radius: 15px;
  }

  .advantage_p2 {
    font-size: 24px;
    font-weight: 900;
  }
  .advantage_div {
    margin: 0 auto;
  }
  .CaseStudy {
    left: 20%;
  }
  .gift_div {
    display: block;
    width: 100%;
    margin: 0 auto;
  }
  .gift {
    padding: 0;
    background-color: #fff;
  }
  .gift_div_2 {
    width: 80%;
    position: absolute;
    top: 20%;
    left: 10%;
  }
  .gift_h3 {
    margin-top: 50px;
    font-size: 26px;
  }
  .gift_span {
    font-size: 60px;
    font-weight: 900;
  }
  .gift_button {
    width: 50%;
    padding: 10px;
    border: 0 none;
    color: #fff;
    font-family: "Comfortaa-Regular";
    font-weight: 700;
    font-size: 22px;
    border-radius: 50px;
    margin: 30px 0 120px 0;
    background: #05b26b;
    border: none;
  }
  .evaluate_div {
    width: 100%;
    border: none;
  }
  .evaluate_img {
    width: 130px;
    margin: 15px 40px;
  }
  .address_button {
    width: 75%;
    font-size: 26px;
  }
  .Consultant_div2 {
    width: 50%;
    text-align: center;
    margin: 0 auto;
  }
  .Consultant_div3 {
    display: flex;
    margin-top: 40px;
  }
  .Consultant_h3 {
    font-size: 20px;
    margin-top: 10px;
  }
  .advantage_margin {
    width: 50%;
    margin: 0px 0 0px 0;
  }

  .advantage_h3 {
    font-size: 20px;
    margin-top: 10px;
  }

  .advantage_p {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .advantage_div_3 {
    margin-top: 30px;
    display: flex;
    justify-content: flex-start;
  }

  .advantage_width {
    width: 50%;
  }
  .advantage_p3 {
    font-size: 30px;
    margin-bottom: -77px;
    font-weight: 900;
    color: #00e467;
  }
  .Heavyhoop {
    position: initial;
    text-align: center;
  }
  .Heavyhoop_h3 {
    position: absolute;
    top: 50%;
    right: 15%;
    font-size: 26px;
    margin-bottom: 10px;
  }
  .Heavyhoop_span {
    font-size: 56px;
    color: #05b26b;
    font-family: "Omnium-Bold";
  }
  .advisory {
    position: relative;
    margin: 0px auto;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .box2 {
    width: 90%;
    margin: 10px auto;
    position: relative;
  }
  .box_img2 {
    width: 100%;
  }
  .box_text2 {
    position: absolute;
    top: 0%;
    /* left: 9%; */
    width: 99%;
    text-align: center;
    color: #fff;
    height: 98%;
    border-radius: 41px;
    margin-left: 2px;
    background-color: rgba(60, 60, 60, 0.4);
  }
  .box_text2 h2 {
    margin-top: 120px;
    font-size: 40px;
    color: #fff;
  }
  .box_text2 h4 {
    font-size: 14px;
    font-size: 30px;
    color: #fff;
  }
  .box_text2 p {
    font-size: 20px;
    margin: 0 21px;
    color: #fff;
  }
  .boss_box_img {
    top: -16px;
  }
  .boss_man_div_rig p {
    margin: 0 0px 20px 0;
  }
  .free-container {
    display: flex;
    justify-content: space-around;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .free-content {
    width: 50%;
    margin: 0 0 10px 0;
    padding: 0 20px;
  }
  .free-div {
    width: 80%;
  }
  .feedback {
    width: 90%;
  }
  .van-checkbox-group {
    padding: 12px 0px 0px 23%;
  }
}

@media all and (max-width: 720px) {
  .clinic-img {
    width: 170px;
  }

  .process_h2_1 {
    top: 43px;
    font-size: 24px;
  }

  .process_h3_1 {
    top: 91px;
    font-size: 18px;
  }

  .Price_h2_3 {
    top: 87px;
    font-size: 24px;
  }

  .Price_h3_2 {
    top: 133px;
    font-size: 18px;
  }

  .process_h2_2 {
    top: 72px;
    font-size: 24px;
  }

  .process_h3_2 {
    top: 115px;
    font-size: 18px;
  }

  .process_h2 {
    top: 105px;
    font-size: 24px;
  }

  .process_h3 {
    top: 147px;
    font-size: 18px;
  }

  .Price_h3 {
    top: 398px;
    font-size: 18px;
  }

  .Price_h3_1 {
    top: 100px;
    left: 60px;
    font-size: 18px;
  }

  .Price_h2_2 {
    top: 65px;
    left: 60px;
    font-size: 24px;
  }

  .process_h2_3 {
    top: 120px;
    right: 133px;
    font-size: 26px;
  }

  .process_h3_3 {
    top: 155px;
    right: 150px;
    font-size: 18px;
  }

  .process_h2_4 {
    top: 100px;
    left: 50px;
    font-size: 32px;
  }

  .process_h3_4 {
    top: 230px;
    left: 50px;
    font-size: 20px;
  }
}

@media all and (max-width: 570px) {
  .shopify-section {
    height: 40px;
    padding: 5px 0;
  }

  .shop {
    padding: 20px 10px;
  }

  .deta {
    padding: 15px;
    margin: 20px 0;
    display: flex;
    flex-direction: row;
  }

  .deta_div {
    width: 40%;

    margin: 0 auto;
  }

  .clinic-img {
    width: 100%;
  }

  .deta_div_2 {
    width: 80%;
    margin: 0 8px 0 14px;
  }

  .deta_p {
    font-size: 14px;
  }

  .deta_p > img {
    width: 18px;
    height: 18px;
  }

  .deta_h3 {
    font-size: 22px;
    margin-top: 0;
  }

  .shop_h2 {
    font-size: 32px;
  }

  .name {
    font-weight: 100;
    font-size: 16px;
    padding-left: 16px;
  }

  .van-calendar {
    box-shadow: 0px 0px 7px 7px rgba(89, 115, 121, 0.1);
  }

  .deta_button {
    width: 100%;
    padding: 10px 0;
    font-size: 16px;
  }

  .advantage_h2 {
    font-size: 26px;
    margin-bottom: 10px;
    text-align: center;
    margin-top: 70px;
  }

  .top {
    margin-top: 42px;
  }

  .superiority_table {
    display: none;
  }

  .form-img {
    width: 100%;
    display: block;
  }

  .evaluate_img {
    width: 110px;
    margin: 15px 20px;
  }

  .waist_button_2 {
    width: 40%;
    margin-top: 60px;
  }

  .waist_button {
    width: 65%;
  }

  .navbar-brand {
    margin-left: 24%;
  }

  .computer_h1 {
    font-size: 40px;
  }

  .computer_p {
    font-size: 18px;
    margin: 0;
  }

  .computer_span_1 {
    font-size: 26px;
  }

  .computer_span_2 {
    font-size: 20px;
  }

  .deta_button_3 {
    width: 55%;
    font-size: 16px;
  }

  .nextStep > button {
    width: 80%;
    font-size: 18px;
  }

  .list-item {
    width: 95%;
    font-size: 16px;
  }

  .list-item_span {
    font-size: 15px;
  }

  .van-popup >>> .van-button__text {
    font-size: 17px !important;
  }

  .van-cell {
    width: 90%;
    font-size: 14px !important;
    font-weight: 700;
    height: 52px;
    padding: 6px 16px 10px 16px;
    line-height: 20px;
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
  }

  .calendar {
    margin-top: 0;
  }

  .compare_2 {
    width: 85%;
  }

  .area {
    width: 90%;
  }

  .van-field {
    width: 90%;
    border: 2px solid #00e467;
    border-radius: 10px;
    margin: auto;
    margin-top: 20px;
    font-size: 16px;
    padding: 10px 16px;
    font-weight: 700;
    background: #fff;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .hint {
    width: 90%;
  }

  .input_button {
    width: 50%;
  }

  .confidence_title {
    font-size: 32px;
  }

  .waist_button {
    margin: 20px 0 0 0;
  }

  .input {
    margin-top: 60px;
  }

  .answer {
    width: 86%;
  }

  .input_name {
    width: 90%;
  }

  .el-dialog__wrapper >>> .el-dialog {
    width: 90%;
  }

  .van-collapse {
    width: 100%;
    padding: 0;
  }

  .el-collapse >>> .el-collapse-item__content {
    padding: 10px 0px;
  }

  .team_img {
    width: 100%;
  }

  .move_img_3 {
    margin-top: 0;
    width: 90%;
  }

  .Bottom_div {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    flex-direction: column;
    text-align: center;
    padding: 0;
  }

  .Bottom_p1 {
    text-align: center;
    margin: 6px 0;
  }

  .move_p {
    font-size: 16px;
    margin: 24px 0 5px 0;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 290px !important;
  } */

  .customers {
    margin-bottom: 90px;
  }

  .input_span_2 {
    width: 180px;
  }

  .process_h2_1 {
    top: 40px;
    font-size: 26px;
  }

  .process_h3_1 {
    width: 65%;
    font-size: 20px;
  }

  .Price_h2_3 {
    text-align: center;
    top: 54px;
    font-size: 26px;
  }

  .Price_h3_2 {
    top: 100px;
    font-size: 20px;
  }

  .process_h2_2 {
    text-align: center;
    font-size: 26px;
  }

  .process_h3_2 {
    top: 103px;
    font-size: 20px;
  }

  .process_h2 {
    top: 84px;
    font-size: 26px;
  }

  .Price_h3_1 {
    font-size: 20px;
  }

  .Price_h2_2 {
    font-size: 26px;
  }

  .Price_h3 {
    font-size: 20px;
    margin-top: 20px;
  }
  .Price_p {
    font-size: 16px;
  }

  .process_h3 {
    top: 129px;
    font-size: 20px;
    width: 50%;
  }

  .process_h2_3 {
    top: 100px;
    right: 123px;
    font-size: 26px;
  }

  .process_h3_3 {
    font-size: 22px;
    color: #323e48;
  }

  .process_h2_4 {
    font-size: 26px;
    padding-bottom: 20px;
    margin-bottom: 60px;
  }
  .gift_p {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .gift_div_2 {
    top: 15%;
  }
  .gift_h3 {
    font-size: 22px;
  }
  .gift_button {
    font-size: 18px;
    margin: 30px 0 0px 0;
  }
  .gift_span {
    font-size: 52px;
  }

  .process_h3_4 {
    font-size: 20px;
  }

  .star {
    width: 20px;
  }

  .advantage_p {
    font-size: 14px;
    margin-bottom: 10px;
  }
  .address {
    top: 70px;
    left: 6%;
  }

  .address_h2 {
    font-size: 32px;
  }

  .address_h3 {
    font-size: 20px;
    margin: 10px 0;
  }
  .StoreLocation {
    top: 60px;
  }

  .team {
    bottom: 90px;
    right: 6%;
  }

  .team_h2 {
    font-size: 32px;
  }

  .team_h3 {
    font-size: 22px;
    margin-bottom: 15px;
  }

  .team_p {
    font-size: 14px;
  }

  .StoreLocation_h2 {
    font-size: 34px;
    margin-bottom: 15px;
  }
  .layout {
    padding: 30px 0;
  }
  .BraceTeeth {
    padding: 40px 30px;
  }

  .BraceTeeth_h2 {
    margin-top: 35px;
    font-size: 28px;
  }

  .BraceTeeth_button {
    padding: 6px 35px;
    margin-bottom: 30px;
    font-size: 18px;
    font-weight: 700;
  }

  .BraceTeeth_2 {
    padding: 40px 30px;
  }

  .BraceTeeth_h2_2 {
    margin-top: 35px;
    font-size: 28px;
  }

  .BraceTeeth_button_2 {
    padding: 6px 35px;
    margin-bottom: 30px;
    font-size: 18px;
    font-weight: 700;
  }

  .BraceTeeth_p_2 {
    margin: 10px 0 15px 0;
    font-size: 15px;
  }
  .promotion_img {
    width: 55%;
  }
  .promotion_left_h3 {
    font-size: 24px;
  }
  .promotion_left {
    width: 80%;
  }
  .promotion_left_img {
    width: 60%;
  }
  .promotion_left_p {
    font-size: 16px;
  }
  .advantage {
    width: 90%;
    display: flex;
    justify-content: space-around;
  }
  .advantage_p2 {
    font-size: 20px;
    margin-bottom: 0;
  }
  td {
    font-size: 18px;
    padding: 10px 8px;
  }
  th {
    line-height: 24px;
    font-size: 20px;
  }
  .scheme_button {
    width: 50%;
    margin: 0px 0 90px 0;
  }
  .video_h2 {
    font-size: 26px;
  }
  .video_div {
    height: 360px;
  }
  .Consultant {
    margin: 90px auto 0 auto;
  }
  .Consultant_div2 {
    width: 50%;
    text-align: center;
    margin: 0 auto;
  }
  .Consultant_div3 {
    display: flex;
    margin-top: 40px;
  }
  .Consultant_h3 {
    font-size: 20px;
    margin-top: 10px;
  }
  .advantage_margin {
    width: 45%;
    margin: 4px 0 20px 0;
  }

  .advantage_h3 {
    font-size: 18px;
    margin-top: 6px;
  }

  .advantage_p {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .advantage_div_3 {
    margin-top: 30px;
    display: flex;
    justify-content: flex-start;
  }

  .step {
    padding: 4px 20px 30px 20px;
    border: 1px solid #00e467;
    margin: 0px 0 40px 0;
    border-radius: 15px;
  }
  .advantage_width {
    width: 50%;
  }
  .CaseStudy {
    left: 5%;
  }
  .address_button {
    width: 90%;
    font-size: 18px;
    padding: 8px;
  }
  .Heavyhoop_h2 {
    font-size: 32px;
  }
  .Heavyhoop_h2_2 {
    font-size: 20px;
  }
  .Heavyhoop_h3 {
    top: 55%;
    right: 12%;
    font-size: 20px;
  }
  .Heavyhoop_span {
    font-size: 42px;
  }
  .evaluate_h2 {
    font-size: 26px;
  }
  .evaluate_h3 {
    font-size: 20px;
  }
  .evaluate_img_3 {
    width: 120px;
  }
  .CaseStudy_div {
    margin-bottom: 100px;
  }
  .computer_div_2 {
    bottom: 100px;
  }
  .service3_h2 {
    margin: 60px auto 15px auto;
    font-size: 26px;
    text-align: center;
    line-height: 35px;
  }
  .box_text2 h2 {
    margin-top: 50px;
  }
  .box_text2 p {
    margin: 10px 20px;
  }
  .free-title {
    font-size: 32px;
  }
  .free-tags {
    font-size: 20px;
  }
  .free-div {
    font-size: 18px;
  }
  .free-content img {
    width: 50%;
  }
  .free-content h3 {
    font-size: 22px;
  }
  .free-content p {
    font-size: 16px;
  }
  .StoreLocation-p {
    font-size: 16px;
    margin-bottom: 6px;
  }
  .StoreLocation-p img {
    width: 24px;
    margin-right: 5px;
  }
  .td-span {
    font-size: 16px;
  }
  .feedback-div {
    width: 98%;
    margin: 20px auto;
    padding: 15px 10px;
    height: 235px;
    display: flex;
    flex-direction: row;
  }
  .feedback-icon {
    width: 100%;
    height: auto;
    padding-left: 10px;
  }
  .feedback-name {
    margin: 10px 0 5px 0;
    font-size: 22px;
  }
  .feedback-name-span {
    font-size: 20px;
  }
  .feedback-p {
    font-size: 14px;
  }
  .feedback-star {
    width: 200px;
    margin: 0 0 16px 0;
  }
  .feedback-photo {
    width: 80px;
    border-radius: 50px;
  }
  .feedback-h2 {
    margin: 30px 0 40px 0;
    font-size: 26px;
  }
  .feedback-time {
    font-size: 13px;
    margin-bottom: 10px;
  }
  .feedback >>> .el-carousel__container {
    height: 270px !important;
  }
  .feedback-button {
    font-size: 16px;
    margin: 0;
  }
  .feedback-left h4 {
    font-size: 16px;
  }
  .feedback-left {
    padding: 0 0 0 20px;
  }
  .feedback-right {
    width: 60%;
  }
  .feedback-width {
    width: 110%;
  }
  /* .feedback-width-2 {
    width: 100%;
  } */

  .el-collapse >>> .el-collapse-item__content {
    border-bottom: 1px solid #cccc;
    padding: 2px;
    background-color: #fff;
    font-size: 12px;
  }
  .el-collapse >>> .el-collapse-item__header {
    border-bottom: 1px solid hsla(0, 0%, 80%, 0.8);
    height: 40px;
    background-color: #fff;
    font-size: 16px;
    line-height: 16px;
  }

  .service_div {
    width: 90%;
  }
  .service {
    font-size: 16px;
  }
}

@media all and (max-width: 440px) {
  .announcement-bar__message_p {
    font-size: 12px;
  }

  .van-collapse >>> .van-collapse-item__content {
    padding: 0;
  }

  .van-collapse >>> .van-collapse-item__wrapper {
    margin-top: 0px;
  }

  .van-collapse {
    margin-bottom: 40px;
  }

  .shop_p {
    margin-bottom: 24px;
    text-align: left;
    font-size: 18px;
  }

  .calendar_p {
    width: 90%;
    margin: 0 auto;
    padding: 0;
    margin-bottom: 30px;
    text-align: left;
    font-size: 18px;
  }

  .calendar_p2 {
    width: 90%;
    margin: 50px auto 0px auto;
    padding: 0;
    font-size: 18px;
    text-align: left;
  }

  .input {
    margin-top: 35px;
  }

  .input_name {
    width: 95%;
  }

  .input_span {
    font-size: 16px;
    margin-right: 10px;
  }

  .van-radio-group--horizontal {
    font-size: 14px;
  }

  .el-input >>> .el-input__inner {
    height: 42px;
    font-size: 12px;
  }

  .el-select >>> .el-input__inner {
    height: 42px;
    font-size: 12px;
  }

  .el-select {
    margin-right: 6px;
  }

  .hint {
    width: 100%;
    font-size: 14px;
    margin-bottom: 40px;
  }

  .team_img {
    width: 90%;
    margin: 10px 0 0px 0;
  }

  .van-collapse >>> .van-cell {
    width: 100%;
    height: 36px;
    line-height: 16px;
    margin: auto;
    margin-bottom: 10px;
  }

  .van-collapse >>> .van-cell__right-icon {
    line-height: 16px;
  }

  .shop {
    padding: 30px 20px 60px 20px;
  }

  .deta {
    padding: 10px 0 10px 10px;
  }

  .deta_p {
    font-size: 12px;
    margin-bottom: 5px;
  }

  .deta_h3 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .list-item {
    padding: 8px 0;
  }

  .navbar-brand {
    margin-left: 17%;
  }

  .Blooming_button {
    width: 60%;
    padding: 6px 0;
  }

  .waist_button {
    width: 80%;
    padding: 6px;
    font-size: 18px;
  }

  .waist_button_2 {
    width: 60%;
    padding: 6px 0;
    font-size: 18px;
  }

  .team {
    margin-bottom: 0px;
  }

  .compare_2 {
    width: 95%;
    padding: 10px;
  }

  /* .compare_div_right {
    height: 240px;
  } */
  .shop_h2 {
    font-size: 26px;
    line-height: 32px;
    margin-bottom: 40px;
  }

  .shopify-section {
    padding: 6px 0 5px 0;
  }

  .computer_h1 {
    font-size: 36px;
  }

  .computer_p {
    font-size: 15px;
    margin: 0px 5px;
  }

  .computer_span_1 {
    font-size: 24px;
  }

  .computer_span_2 {
    font-size: 16px;
  }

  .computer_div {
    top: 5%;
  }

  .deta_button_3 {
    width: 70%;
    padding: 8px 10px;
    margin-bottom: 10px;
  }

  .advantage_h2 {
    font-size: 22px;
    padding: 0;
    line-height: 32px;
    margin-bottom: 10px;
    margin-top: 40px;
  }

  .advantage_p {
    font-size: 14px;
    padding: 0px 15px;
    margin-bottom: 10px;
    line-height: 18px;
  }

  .confidence_title {
    font-size: 26px;
    padding: 0 16px;
    line-height: 32px;
    margin: 30px 0 30px 0;
  }

  .input_button {
    width: 60%;
    padding: 8px 0;
    margin: 0;
    font-size: 17px;
  }

  .subscription {
    width: 100%;
    margin-top: 20px;
    margin-bottom: 0px;
  }

  .el-collapse >>> .el-collapse-item__header {
    font-size: 14px;
    line-height: 16px;
  }

  .el-dialog__wrapper >>> .el-dialog__title {
    font-size: 20px;
  }

  .el-dialog__wrapper >>> .el-dialog__header {
    padding-top: 50px;
  }

  .el-dialog__wrapper >>> .el-dialog__body {
    padding: 10px 10px 20px 10px;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 260px !important;
  } */

  .advantage {
    margin: 0 auto 10px auto;
  }

  .el-carousel >>> .el-carousel__indicator--horizontal button {
    width: 9px;
    height: 10px;
    background: #949494;
    border-radius: 50%;
    opacity: 0.5;
  }

  .van-checkbox >>> .van-checkbox__icon {
    font-size: 20px;
    margin-right: 5px;
  }

  .el-carousel >>> .el-carousel__indicator--horizontal.is-active button {
    width: 9px;
    height: 10px;
    background: #05b26b;
    opacity: 1;
    border-radius: 10px;
  }

  .van-calendar {
    height: 410px !important;
  }

  .Bottom_img {
    width: 90px;
    margin-bottom: 14px;
  }

  .Bottom_p1 {
    font-size: 12px;
  }

  .Bottom_p {
    font-size: 12px;
  }

  .Bottom {
    padding: 25px 0;
  }

  .computer_div_2 {
    bottom: 60px;
  }
  .computer_h2 {
    font-size: 24px;
    margin: 10px 0;
  }
  .customers {
    margin-bottom: 60px;
  }

  .advantage_p2 {
    padding: 0;
    font-size: 16px;
  }

  @keyframes tracking-in-contract-bck-bottom {
    0% {
      letter-spacing: 0.2em;
      transform: translateZ(400px) translateY(200px);
      opacity: 0;
    }

    40% {
      opacity: 0.6;
    }

    100% {
      transform: translateZ(0) translateY(0);
      opacity: 1;
    }
  }

  .computer_span {
    margin: 0 5px;
  }

  .Bottom_Kindly > p {
    font-size: 14px;
  }

  .move_img_3 {
    width: 100%;
  }

  .process_h2_1 {
    margin: 60px 0 20px 0;
    font-size: 22px;
  }

  .process_h3_1 {
    width: 80%;
    font-size: 18px;
    margin: 0 auto 40px auto;
  }

  .Price_h2_3 {
    margin-bottom: 20px;
    font-size: 22px;
  }

  .Price_h3_2 {
    width: 50%;
    font-size: 18px;
  }

  .process_h2_2 {
    margin-bottom: 20px;
    font-size: 22px;
  }

  .process_h3_2 {
    width: 70%;
    font-size: 18px;
    margin-bottom: 30px;
  }

  .process_h2 {
    margin-bottom: 20px;
    font-size: 22px;
  }

  .process_h3 {
    margin-bottom: 0;
    font-size: 16px;
  }

  .Price_h2_2 {
    font-size: 26px;
  }

  .process_h2_3 {
    top: 70px;
    right: 95px;
    font-size: 22px;
  }

  .process_h3_3 {
    top: 230px;
    font-size: 18px;
  }

  .process_h2_4 {
    padding-bottom: 20px;
    margin-bottom: 30px;
  }

  .process_h3_4 {
    font-size: 18px;
  }

  .Price_h3_1 {
    margin-bottom: 25px;
    font-size: 22px;
  }

  .Price_h3 {
    margin-top: 0;
    font-size: 18px;
  }

  .star {
    width: 18px;
    margin: 0 6px;
  }
  .advantage_h3 {
    margin-top: 0px;
    margin-bottom: 2px;
  }
  .address {
    top: 50px;
    left: 5%;
  }
  .StoreLocation_h2 {
    font-size: 28px;
  }
  .team {
    bottom: 70px;
  }

  .team_h2 {
    font-size: 28px;
    margin-bottom: 0px;
  }

  .team_h3 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .team_p {
    font-size: 12px;
  }

  .layout {
    padding: 25px 0;
  }
  .BraceTeeth {
    height: 220px;
    width: 85%;
    margin: 0 auto 10px auto;
    padding: 0 30px;
  }

  .BraceTeeth_2 {
    height: 220px;
    width: 85%;
    margin: 0 auto 10px auto;
    padding: 0 30px;
  }

  .BraceTeeth_h2 {
    font-size: 24px;
  }

  .BraceTeeth_button {
    padding: 4px 30px 2px 30px;
    margin-bottom: 30px;
    font-size: 18px;
    font-weight: 700;
  }

  .BraceTeeth_h2_2 {
    font-size: 24px;
    margin-top: 22px;
  }

  .BraceTeeth_p {
    margin: 15px 0 20px 0;
    font-size: 14px;
  }

  .BraceTeeth_p_2 {
    margin: 13px 0 14px 0;
    font-size: 14px;
  }
  .promotion_img {
    width: 70%;
  }
  .promotion_left {
    width: 100%;
    padding: 0;
  }
  .promotion_left_img {
    width: 50%;
  }
  .promotion_left_h3 {
    font-size: 20px;
  }
  .promotion_left_p {
    margin: 0 0 2px 0;
    font-size: 14px;
  }
  .promotion_left_div {
    text-align: right;
    margin-right: 20px;
  }
  .advantage_content {
    margin-bottom: 60px;
  }
  table {
    width: 100%;
  }
  .slide {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  td {
    font-size: 16px;
    padding: 10px 6px;
  }

  th {
    font-size: 18px;
  }
  .td_p {
    font-size: 14px;
  }
  .scheme_button {
    width: 60%;
    margin: 0px 0 80px 0;
    font-size: 18px;
  }
  .video_div {
    height: 240px;
  }
  .video_h2 {
    margin-bottom: 40px;
    font-size: 22px;
  }
  .Consultant_h3 {
    font-size: 18px;
  }
  .step {
    padding: 12px 0px 19px 0;
    border: 1px solid #00e467;
    margin: 26px 0 35px;
    border-radius: 15px;
  }
  .advantage_margin {
    width: 75%;
    margin: 25px 0 -10px 0;
  }
  .advantage_width {
    width: 35%;
  }
  .advantage_div_3 {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  .advantage_p3 {
    font-size: 24px;
    margin-bottom: -56px;
    font-weight: 900;
    color: #00e467;
  }
  .Consultant_div {
    margin-bottom: 40px;
  }
  .Consultant_div3 {
    display: flex;
    margin-top: 20px;
  }
  .CaseStudy {
    top: 5%;
    left: 10%;
  }
  .Price_p {
    font-size: 14px;
  }
  .CaseStudy_div {
    margin-bottom: 60px;
  }
  .Heavyhoop_h2 {
    font-size: 30px;
  }
  .Heavyhoop_p {
    font-size: 14px;
  }
  .Heavyhoop_span {
    font-size: 34px;
  }
  .Heavyhoop_h3 {
    top: 60%;
    right: 10%;
    font-size: 18px;
  }
  .gift_div_2 {
    top: 10%;
    left: 8%;
  }
  .gift_p {
    font-size: 14px;
    margin-bottom: 5px;
  }
  .gift_h3 {
    font-size: 18px;
    margin-top: 35px;
  }
  .gift_span {
    font-size: 42px;
  }
  .gift_button {
    font-size: 16px;
    margin: 30px 0 0px 0;
    width: 55%;
  }
  .evaluate_h2 {
    margin: 50px 0 30px 0;
  }
  .evaluate_img {
    width: 100px;
    margin: 15px 15px;
  }
  .address {
    width: 60%;
  }
  .address_h2 {
    font-size: 28px;
  }
  .address_button {
    font-size: 16px;
  }
  .evaluate_h3 {
    margin-bottom: 30px;
  }
  .advisory {
    position: relative;
    margin: 20px auto 30px auto;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .box2 {
    width: 90%;
    margin: 10px auto;
    position: relative;
  }
  .box_img2 {
    width: 100%;
  }
  .box_text2 {
    position: absolute;
    top: 0%;
    /* left: 9%; */
    width: 99%;
    text-align: center;
    color: #fff;
    height: 98%;
    border-radius: 23px;
    margin-left: 2px;
    background-color: rgba(60, 60, 60, 0.4);
  }
  .box_text2 h2 {
    font-size: 25px;
    margin-top: 45px;
    color: #fff;
  }
  .box_text2 h4 {
    font-size: 16px;
    color: #fff;
  }
  .box_text2 p {
    font-size: 12px;
    margin: 0 26px;
    color: #fff;
  }
  .box_btn {
    font-size: 16px;
    padding: 5px 60px;
    margin-top: 15px;
  }
  .td-span {
    font-size: 12px;
  }
  .free {
    padding: 70px 0 10px 0;
  }
  .free-title {
    font-size: 26px;
    margin-bottom: 10px;
  }
  .free-tags {
    font-size: 18px;
    margin: 0 0 20px 0;
  }
  .free-div {
    width: 85%;
    font-size: 16px;
    padding: 20px 10px;
    border-radius: 15px;
    margin: 20px auto 30px auto;
  }
  .free-content h3 {
    font-size: 20px;
  }
  .free-container {
    width: 96%;
  }
  .free-content {
    padding: 0 5px;
  }
  .free-content p {
    padding: 0;
    font-size: 15px;
  }
  .feedback {
    width: 90%;
    margin: 0px auto;
  }
  .feedback-div {
    width: 98%;
    margin: 20px auto;
    padding: 0;
    height: 220px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .center_p {
    font-size: 18px;
  }
  .feedback-h2 {
    margin: 50px 0 40px 0;
    font-size: 26px;
    line-height: 38px;
  }
  .feedback-time {
    font-size: 13px;
    margin-bottom: 10px;
  }
  .feedback >>> .el-carousel__container {
    height: 265px !important;
  }
  .feedback-button {
    font-size: 16px;
    margin: 0;
  }
  .feedback-left h4 {
    font-size: 16px;
  }
  .feedback-right {
    width: 50%;
  }
  .feedback-width {
    width: 100%;
  }
  .feedback-left {
    padding: 0 0 0 15px;
  }
  .feedback-width-2 {
    width: 90%;
  }
  .feedback-h4 {
    font-size: 15px !important;
  }
  .feedback-icon {
    width: 100%;
    height: auto;
    padding: 0;
  }
  .feedback-name {
    margin: 10px 0 5px 0;
    font-size: 22px;
    line-height: normal;
  }
  .feedback-p {
    font-size: 14px;
  }
  .feedback-star {
    width: 200px;
    margin: 0 0 16px 0;
  }
  .feedback-photo {
    width: 80px;
    border-radius: 50px;
  }
  .service_div {
    width: 95%;
  }
}

@media all and (max-width: 415px) {
  .advantage {
    width: 85%;
  }

  .van-radio >>> .van-radio__icon {
    font-size: 18px;
  }

  .computer_h1 {
    font-size: 38px;
  }

  .process_h2_1 {
    top: 30px;
  }

  .Price_h2_3 {
    top: 38px;
  }

  .img_button_2 {
    bottom: 20px;
  }

  .process_h2_2 {
    top: 42px;
  }

  .process_h3_2 {
    top: 77px;
    font-size: 16px;
  }

  .img_button_3 {
    bottom: 20px;
  }

  .process_h2 {
    top: 63px;
  }

  .process_h3 {
    top: 96px;
  }

  .img_button_4 {
    bottom: 20px;
  }

  .layout {
    padding: 20px 0;
  }
  .promotion_left_div {
    width: 40%;
  }
  .promotion_left_img {
    width: 55%;
  }
  .scheme_button {
    font-size: 16px;
  }
  .step {
    padding: 10px 0px 16px 0;
  }
  .gift_h3 {
    margin-top: 30px;
  }
  .process_h2_4 {
    padding-bottom: 15px;
  }
  .gift_button {
    margin: 5px 0 0px 0;
    width: 60%;
  }
  .gift_span {
    font-size: 40px;
  }
  .evaluate_img {
    width: 90px;
    margin: 5px 15px;
  }
  .computer_h2 {
    font-size: 22px;
  }
}

@media all and (max-width: 400px) {
  .navbar {
    position: relative;
    display: flex;
    justify-content: flex-end;
    flex-direction: row-reverse;
    align-items: center;
    padding: 1px 0;
  }

  .navbar-brand {
    margin-left: 15%;
  }

  .logo {
    width: 120px;
  }

  .advantage_h2 {
    /* font-size: 26px; */
    line-height: 32px;
    margin-bottom: 20px;
  }

  .prove1 > img {
    width: 110px;
  }

  .computer_h1 {
    font-size: 38px;
  }
  .computer_h2 {
    margin: 8px 0;
  }
  .computer_p {
    font-size: 14px;
  }

  .computer_div_2 {
    bottom: 50px;
  }

  .computer_span_1 {
    font-size: 22px;
    margin: 0 4px;
  }

  .computer_span_2 {
    font-size: 15px;
  }

  .compare_2 {
    width: 93%;
  }

  .el-dialog__wrapper >>> .el-dialog {
    width: 95%;
  }

  .advantage_p {
    font-size: 15px;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 230px !important;
  } */

  .el-carousel >>> .el-carousel__indicator--horizontal button {
    width: 8px;
    height: 8px;
  }

  .el-carousel >>> .el-carousel__indicator--horizontal.is-active button {
    width: 8px;
    height: 8px;
  }

  .input_span {
    font-size: 15px;
  }
  .service {
    font-size: 15px;
  }

  .el-input >>> .el-input__inner {
    height: 40px;
  }

  .hint {
    font-size: 13px;
    margin-bottom: 40px;
    padding: 0 10px;
  }

  .input_name {
    margin: 25px auto;
  }

  .subscription_span {
    font-size: 12px;
  }

  .van-checkbox >>> .van-checkbox__label {
    font-size: 14px;
    margin-left: -4px;
  }

  .van-checkbox >>> .van-checkbox__icon {
    font-size: 18px;
    margin-right: 10px;
  }

  .advantage_p2 {
    font-size: 16px;
  }

  .computer_span {
    margin: 0 2px;
  }

  .Price_h3 {
    top: 550px;
  }

  .process_h2_1 {
    top: 27px;
  }

  .process_h3_1 {
    margin: 0 auto 30px auto;
  }

  .Price_h2_3 {
    top: 34px;
  }

  .Price_h3_2 {
    top: 72px;
  }

  .process_h2_2 {
    top: 37px;
  }

  .process_h3_2 {
    top: 73px;
  }

  .process_h2 {
    top: 58px;
  }

  .process_h3 {
    top: 93px;
  }
  .advantage_h3 {
    font-size: 16px;
    margin-bottom: 0px;
    margin-top: 2px;
  }
  .StoreLocation_h2 {
    font-size: 27px;
  }

  .team_h2 {
    font-size: 26px;
  }

  .team_h3 {
    font-size: 16px;
    margin-bottom: 6px;
  }
  .team_p {
    font-size: 11px;
  }
  .team {
    bottom: 60px;
    right: 6%;
  }
  .deta_button_3 {
    width: 70%;
    font-size: 15px;
  }
  td {
    font-size: 14px;
  }

  .CaseStudy {
    left: 10%;
  }
  .Price_p {
    font-size: 13px;
  }
  .BraceTeeth_h2_2 {
    margin-top: 28px;
  }
  .BraceTeeth_p_2 {
    margin: 10px 0 10px 0;
    font-size: 13px;
  }
  .StoreLocation-p {
    font-size: 13px;
    margin-bottom: 4px;
  }
  .StoreLocation-p img {
    width: 18px;
    margin-right: 2px;
  }
  .StoreLocation {
    top: 45px;
  }
  .free {
    padding: 55px 0 0px 0;
  }
  .feedback-div {
    width: 98%;
    margin: 20px auto;
    /* padding: 15px 15px; */
    height: 220px;
    display: flex;
    flex-direction: row;
  }
  .feedback-icon {
    width: 100%;
  }
  .feedback-name {
    margin: 10px 0 5px 0;
    font-size: 20px;
  }
  .feedback-p {
    font-size: 14px;
  }
  .feedback-star {
    margin: 0 0 16px 0;
  }
  .feedback-photo {
    width: 80px;
    border-radius: 50px;
  }
  .van-checkbox-group {
    padding: 12px 0px 0px 24%;
  }
}

@media all and (max-width: 380px) {
  .announcement-bar__message_p {
    font-size: 11px;
  }

  .computer_h1 {
    font-size: 32px;
  }

  /* .el-carousel >>> .el-carousel__container {
    height: 220px !important;
  } */

  .computer_p {
    font-size: 14px;
  }
  .BraceTeeth_2 {
    height: 210px;
  }

  .BraceTeeth {
    height: 210px;
  }

  .BraceTeeth_button {
    padding: 5px 20px 1px 20px;
    font-size: 16px;
  }

  .BraceTeeth_p_2 {
    margin: 6px 0 8px 0;
    font-size: 14px;
  }

  .BraceTeeth_h2_2 {
    margin-top: 25px;
  }
}
</style>
