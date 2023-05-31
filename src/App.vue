<script lang="ts">
import { useQuasar } from 'quasar'

export default {
  data(): any {
    return {
      $q: useQuasar(),
      bnccData: null,
      confirmClearAll: false,
      curriculum: {
        assessment: '',
        experienceFields: {}
      },
      error: false,
      filteredContentOptions: null,
      forPrinting: false,
      loading: true,
      selectedAgeGroup: null,
      selectedArea: null,
      selectedContent: null,
      selectedExperienceField: null,
      tab: 'contents'
    }
  },
  computed: {
    ageGroupOptions(): any[] {
      return this.bnccData.areasByName[this.selectedArea]
        .map((ageGroup: any) => {
          return {
            label: `${ageGroup.name} (${ageGroup.range})`,
            value: ageGroup.name
          }
        })
        .sort((a: any, b: any) => a.label.localeCompare(b.label))
    },
    areaOptions(): any[] {
      return this.bnccData.areas
        .map((area: any) => {
          return {
            label: area,
            value: area
          }
        })
        .sort((a: any, b: any) => a.label.localeCompare(b.label))
    },
    contentOptions(): any[] {
      const contents =
        this.curriculum.experienceFields[this.selectedExperienceField]?.contents ?? []

      return this.bnccData.contentsByAgeGroupAndExperienceField[this.selectedAgeGroup][
        this.selectedExperienceField
      ]
        .map((content: any) => {
          const objective = this.bnccData.contentsByCode[content].objectives[0]

          return {
            label: `(${content}) ${objective}`,
            value: content,
            disable: contents.includes(content) === true
          }
        })
        .sort((a: any, b: any) => a.label.localeCompare(b.label))
    },
    contentsExperienceFields(): string[] {
      return Object.keys(this.curriculum.experienceFields).sort((a: string, b: string) =>
        a.localeCompare(b)
      )
    },
    experienceFieldOptions(): any[] {
      return this.bnccData.experienceFields
        .map((experienceField: any) => {
          return {
            label: experienceField,
            value: experienceField
          }
        })
        .sort((a: any, b: any) => a.label.localeCompare(b.label))
    },
    hasContents(): boolean {
      return Object.keys(this.curriculum.experienceFields).length > 0
    },
    selectedContentLabel(): string {
      if (!this.selectedContent) {
        return ''
      }

      const objective = this.bnccData.contentsByCode[this.selectedContent].objectives[0]

      return `(${this.selectedContent}) ${objective}`
    }
  },
  watch: {
    forPrinting() {
      if (this.forPrinting === true) {
        return
      }

      this.deselectContentsTable()
    }
  },
  methods: {
    addContent() {
      if (
        Object.prototype.hasOwnProperty.call(
          this.curriculum.experienceFields,
          this.selectedExperienceField
        ) === false
      ) {
        this.curriculum.experienceFields[this.selectedExperienceField] = {
          contents: [],
          strategies: ''
        }
      }

      const experienceFieldContents =
        this.curriculum.experienceFields[this.selectedExperienceField].contents

      experienceFieldContents.push(this.selectedContent)

      experienceFieldContents.sort((a: string, b: string) => a.localeCompare(b))

      this.selectedContent = null

      this.$refs.content.focus()
    },
    clearAll() {
      this.curriculum = {
        assessment: '',
        experienceFields: {}
      }

      this.selectedAgeGroup = null
      this.selectedArea = null
      this.selectedExperienceField = null
      this.selectedContent = null

      this.$q.notify({
        message: 'Todos os conteúdos foram apagados',
        position: 'top',
        timeout: 3000,
        type: 'info'
      })
    },
    copyContentsTable() {
      this.selectContentsTable()

      document.execCommand('copy')

      this.deselectContentsTable()

      this.$q.notify({
        color: 'green',
        message: 'A tabela de conteúdos foi copiada para a área de transferência',
        position: 'bottom-left',
        timeout: 3000,
        type: 'info'
      })
    },
    deselectContentsTable() {
      const el = document.querySelector('.contents-table')
      const sel = window.getSelection()

      if (!sel) {
        return
      }

      for (let i = 0; i < sel.rangeCount; ++i) {
        const range = sel.getRangeAt(i)

        if (range.commonAncestorContainer !== el) {
          continue
        }

        sel.removeRange(range)
      }
    },
    filterContents(value: string, update: Function) {
      if (value === '') {
        update(() => {
          this.filteredContentOptions = this.contentOptions.sort((a: any, b: any) =>
            a.label.localeCompare(b.label)
          )
          this.selectedContent = null
        })

        return
      }

      update(() => {
        const needles = value
          .toLocaleLowerCase()
          .split(' ')
          .filter((needle) => needle.length > 0)

        this.filteredContentOptions = this.contentOptions
          .filter((v: any) => {
            let found = 0

            for (const needle of needles) {
              const label = v.label.toLocaleLowerCase()

              if (label.indexOf(needle) === -1) {
                continue
              }

              found++
            }

            return found === needles.length
          })
          .sort((a: any, b: any) => a.label.localeCompare(b.label))
      })
    },
    selectContentsTable() {
      const el = document.querySelector('.contents-table')
      const range = document.createRange()
      const sel = window.getSelection()

      if (!el || !sel) {
        return
      }

      sel.removeAllRanges()

      try {
        range.selectNodeContents(el)

        sel.addRange(range)
      } catch (e) {
        range.selectNode(el)

        sel.addRange(range)
      }
    }
  },
  mounted() {
    fetch('data.json')
      .then((response) => response.json())
      .then((json) => {
        this.bnccData = json
      })
      .catch(() => (this.error = true))
      .finally(() => (this.loading = false))
  }
}
</script>

<template>
  <q-card class="q-pa-md flex flex-center" dark v-if="loading">
    <q-circular-progress indeterminate rounded size="50px" color="lime" class="q-ma-md" />
  </q-card>

  <q-card class="q-pa-md flex flex-center" dark v-if="error"> Erro carregando dados </q-card>

  <q-card class="no-shadow" dark v-if="!loading && !error">
    <q-select
      dark
      emit-value
      label="Área"
      outlined
      v-model="selectedArea"
      :disable="hasContents"
      :options="areaOptions"
    />

    <q-select
      class="q-mt-sm"
      dark
      emit-value
      label="Idade"
      outlined
      v-if="selectedArea"
      v-model="selectedAgeGroup"
      :disable="hasContents"
      :options="ageGroupOptions"
    />

    <q-select
      class="q-mt-sm"
      dark
      emit-value
      label="Campo de Experiência"
      outlined
      v-if="selectedAgeGroup"
      v-model="selectedExperienceField"
      :options="experienceFieldOptions"
    />

    <q-select
      class="q-mt-sm"
      clearable
      dark
      emit-value
      filtered
      input-debounce="0"
      label="Conteúdo"
      outlined
      ref="content"
      use-input
      v-if="selectedExperienceField"
      v-model="selectedContent"
      :display-value="selectedContentLabel"
      :options="filteredContentOptions"
      @filter="filterContents"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> Nenhum resultado </q-item-section>
        </q-item>
      </template>
    </q-select>
  </q-card>

  <q-dialog persistent v-model="confirmClearAll">
    <q-card class="no-shadow" dark>
      <q-card-section class="row items-center">
        <q-avatar color="negative" icon="error" text-color="white" />

        <span class="q-ml-sm"> Tem certeza de que deseja limpar tudo? </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="positive" flat label="Não" v-close-popup />

        <q-btn color="negative" flat label="Sim" v-close-popup @click="clearAll" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <div class="q-mt-md row justify-end" v-if="selectedExperienceField">
    <q-btn
      class="q-mr-sm"
      color="negative"
      label="Limpar"
      :disable="!hasContents"
      @click="confirmClearAll = true"
    />

    <q-btn color="primary" label="Adicionar" :disable="!selectedContent" @click="addContent" />
  </div>

  <q-card class="q-mt-md no-shadow" dark>
    <q-tabs
      active-color="secondary"
      align="justify"
      class="text-grey"
      dense
      indicator-color="secondary"
      narrow-indicator
      v-model="tab"
    >
      <q-tab label="Informações" name="informations" />

      <q-tab label="Conteúdos" name="contents" />
    </q-tabs>

    <q-separator />

    <q-tab-panels animated dark swipeable v-model="tab">
      <q-tab-panel name="informations">
        <q-expansion-item
          group="informations"
          label="Direitos de aprendizagem"
          header-class="text-teal"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="learningRight in bnccData.learningRights"
              :key="learningRight"
            >
              {{ learningRight }}
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-separator v-if="selectedExperienceField" />

        <q-expansion-item
          group="informations"
          header-class="text-teal"
          v-if="selectedExperienceField"
          :label="`(${selectedExperienceField}) Mais sobre o campo de experiência`"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="description in bnccData.experienceFieldsByName[selectedExperienceField]
                .descriptions"
              :key="description"
            >
              {{ description }}
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-separator v-if="selectedExperienceField" />

        <q-expansion-item
          group="informations"
          header-class="text-teal"
          v-if="selectedExperienceField"
          :label="`(${selectedExperienceField}) Orientações gerais quanto ao processo pedagógico`"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="orientation in bnccData.experienceFieldsByName[selectedExperienceField]
                .orientations"
              :key="orientation"
            >
              {{ orientation }}
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-separator v-if="selectedExperienceField" />

        <q-expansion-item
          group="informations"
          header-class="text-teal"
          v-if="selectedExperienceField"
          :label="`(${selectedExperienceField}) Direitos`"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="right in bnccData.experienceFieldsByName[selectedExperienceField].rights"
              :key="right"
            >
              {{ right }}
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-separator v-if="selectedContent" />

        <q-expansion-item
          group="informations"
          header-class="text-teal"
          v-if="selectedContent"
          :label="`(${selectedContent}) Objetivos de aprendizagem`"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="objective in bnccData.contentsByCode[selectedContent].objectives"
              :key="objective"
            >
              {{ objective }}
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-separator v-if="selectedContent" />

        <q-expansion-item
          group="informations"
          header-class="text-teal"
          v-if="selectedContent"
          :label="`(${selectedContent}) Abordagens das experiências de aprendizagem`"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="approach in bnccData.contentsByCode[selectedContent].approaches"
              :key="approach"
            >
              {{ approach }}
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-separator v-if="selectedContent" />

        <q-expansion-item
          group="informations"
          header-class="text-teal"
          v-if="selectedContent"
          :label="`(${selectedContent}) Sugestões para o currículo`"
        >
          <q-card dark>
            <q-card-section
              class="text-justify text-grey bncc-paragraph"
              v-for="suggestion in bnccData.contentsByCode[selectedContent].suggestions"
              :key="suggestion"
            >
              {{ suggestion }}
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-tab-panel>

      <q-tab-panel name="contents">
        <div class="q-mb-md row" v-if="hasContents">
          <q-toggle
            color="green"
            icon="print"
            keep-color
            label="Para impressão"
            v-model="forPrinting"
          />

          <q-space />

          <q-btn
            class="q-mr-sm"
            color="primary"
            label="Selecionar"
            :disable="!forPrinting"
            @click="selectContentsTable"
          />

          <q-btn color="green" label="Copiar" :disable="!forPrinting" @click="copyContentsTable" />
        </div>

        <table
          cellpadding="0"
          cellspacing="0"
          class="contents-table"
          v-if="hasContents"
          :class="{ print: forPrinting }"
        >
          <thead>
            <th>
              <span> CAMPO DE EXPERIÊNCIA </span>
            </th>

            <th>
              <span> OBJETIVOS DE APRENDIZAGEM </span>

              <span> (Habilidades: o que a criança vai aprender) </span>
            </th>

            <th>
              <span> ESTRATÉGIAS </span>

              <span> (Como ensinar/metodologia) </span>
            </th>

            <th>
              <span> AVALIAÇÃO </span>

              <span> (Monitorar/Analisar) </span>
            </th>
          </thead>

          <tbody>
            <tr
              v-for="(
                contentExperienceField, contentExperienceFieldIndex
              ) in contentsExperienceFields"
              :key="contentExperienceField"
            >
              <td>{{ contentExperienceFieldIndex + 1 }}. {{ contentExperienceField }}</td>

              <td>
                <span
                  v-for="content in curriculum.experienceFields[contentExperienceField].contents"
                  :key="content"
                >
                  ({{ content }}) {{ bnccData.contentsByCode[content].objectives[0] }}
                </span>
              </td>

              <td>
                <q-input
                  dark
                  filled
                  type="textarea"
                  v-model="curriculum.experienceFields[contentExperienceField].strategies"
                  v-if="!forPrinting"
                />

                <span
                  class="span-pre"
                  v-else
                  v-text="curriculum.experienceFields[contentExperienceField].strategies"
                ></span>
              </td>

              <td
                v-if="contentExperienceFieldIndex === 0"
                :rowspan="Object.keys(curriculum.experienceFields).length"
              >
                <q-input
                  dark
                  filled
                  type="textarea"
                  v-model="curriculum.assessment"
                  v-if="!forPrinting"
                  :input-style="{ resize: 'none' }"
                />

                <span class="span-pre" v-else v-text="curriculum.assessment"></span>
              </td>
            </tr>
          </tbody>
        </table>

        <span v-else> Nenhum conteúdo adicionado </span>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<style lang="scss" scoped>
.bncc-paragraph {
  text-indent: 2cm;
}

.contents-table {
  border: 0.5px solid #fff;
  height: 100%;
  user-select: none;
  width: 100%;

  > thead {
    > th {
      > span {
        display: block;
        font-size: 12px;

        &:first-of-type {
          font-weight: bold;
        }

        &:last-of-type {
          font-size: 11px;
        }
      }
    }
  }

  td {
    border: 0.5px solid #fff;
    text-align: justify;

    > span {
      display: block;

      &:not(:first-of-type) {
        margin-top: 10px;
      }
    }

    &:not(:has(textarea)) {
      padding: 10px;
    }
  }

  th {
    border: 0.5px solid #fff;
    padding: 10px;
    white-space: nowrap;
  }

  &.print {
    background: #fff;
    border-color: #000;
    color: #000;
    user-select: text;

    td,
    th {
      border-color: #000;
    }
  }
}

.span-pre {
  white-space: pre;
}
</style>
