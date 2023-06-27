<script lang="ts">
// TODO Export to Google Drive
// TODO Integrate ChatGPT?

import copy from 'copy-to-clipboard'
import * as docx from 'docx'
import { saveAs } from 'file-saver'
import { useQuasar } from 'quasar'

export default {
  data(): any {
    return {
      $q: useQuasar(),
      bnccData: null,
      confirmClearAll: false,
      confirmImportBase64: false,
      curriculum: {
        assessment: '',
        experienceFields: {}
      },
      documentOptions: {
        margin: {
          horizontal: 10,
          vertical: 20
        },
        page: {
          height: 297,
          width: 210
        }
      },
      error: false,
      filteredContentOptions: null,
      forPrinting: false,
      importBase64Text: null,
      justifyText: true,
      landscape: false,
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
    curriculum: {
      deep: true,
      handler() {
        window.localStorage.setItem('curriculum', JSON.stringify(this.curriculum))
      }
    },
    forPrinting() {
      window.localStorage.setItem('forPrinting', Number(this.forPrinting).toString())

      if (this.forPrinting === true) {
        return
      }

      this.deselectContentsTable()
    },
    justifyText() {
      window.localStorage.setItem('justifyText', Number(this.justifyText).toString())
    },
    landscape() {
      window.localStorage.setItem('landscape', Number(this.landscape).toString())
    },
    selectedArea() {
      if (this.selectedArea) {
        window.localStorage.setItem('selectedArea', this.selectedArea)
      } else {
        window.localStorage.removeItem('selectedArea')
      }
    },
    selectedAgeGroup() {
      if (this.selectedAgeGroup) {
        window.localStorage.setItem('selectedAgeGroup', this.selectedAgeGroup)
      } else {
        window.localStorage.removeItem('selectedAgeGroup')
      }
    },
    selectedExperienceField() {
      if (this.selectedExperienceField) {
        window.localStorage.setItem('selectedExperienceField', this.selectedExperienceField)
      } else {
        window.localStorage.removeItem('selectedExperienceField')
      }
    },
    selectedContent() {
      if (this.selectedContent) {
        window.localStorage.setItem('selectedContent', this.selectedContent)
      } else {
        window.localStorage.removeItem('selectedContent')
      }
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

      this.forPrinting = false

      this.selectedAgeGroup = null
      this.selectedArea = null
      this.selectedExperienceField = null
      this.selectedContent = null

      this.$q.notify({
        color: 'positive',
        icon: 'delete',
        message: 'Todos os conteúdos foram apagados',
        position: 'bottom-left',
        timeout: 3000
      })

      setTimeout(() => {
        this.$refs.area.focus()
      }, 1)
    },
    copyContentsTable() {
      this.selectContentsTable()

      document.execCommand('copy')

      this.deselectContentsTable()

      this.$q.notify({
        color: 'positive',
        icon: 'content_copy',
        message: 'A tabela de conteúdos foi copiada para a área de transferência',
        position: 'bottom-left',
        timeout: 3000
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
    exportBase64() {
      const dataToExport = {
        curriculum: this.curriculum,
        forPrinting: this.forPrinting,
        justifyText: this.justifyText,
        landscape: this.landscape,
        selectedAgeGroup: this.selectedAgeGroup,
        selectedArea: this.selectedArea,
        selectedContent: this.selectedContent,
        selectedExperienceField: this.selectedExperienceField
      }

      const base64 = btoa(JSON.stringify(dataToExport))

      const success = copy(base64, {
        format: 'text/plain'
      })

      if (success) {
        this.$q.notify({
          color: 'positive',
          icon: 'content_copy',
          message: 'A base64 foi copiada para a área de transferência',
          position: 'bottom-left',
          timeout: 3000
        })
      } else {
        this.$q.notify({
          color: 'negative',
          icon: 'error',
          message: 'Erro ao copiar base64 para a área de transferência',
          position: 'bottom-left',
          timeout: 3000
        })
      }
    },
    exportDocx() {
      const rows = [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderText',
                  text: 'CAMPO DE EXPERIÊNCIA'
                })
              ],
              verticalAlign: docx.VerticalAlign.CENTER
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderText',
                  text: 'OBJETIVOS DE APRENDIZAGEM'
                }),
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderSubText',
                  text: '(Habilidades: o que a criança vai aprender)'
                })
              ],
              verticalAlign: docx.VerticalAlign.CENTER
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderText',
                  text: 'ESTRATÉGIAS'
                }),
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderSubText',
                  text: '(Como ensinar/metodologia)'
                })
              ],
              verticalAlign: docx.VerticalAlign.CENTER
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderText',
                  text: 'AVALIAÇÃO'
                }),
                new docx.Paragraph({
                  alignment: docx.AlignmentType.CENTER,
                  style: 'tableHeaderSubText',
                  text: '(Monitorar/analisar)'
                })
              ],
              verticalAlign: docx.VerticalAlign.CENTER
            })
          ],
          tableHeader: true
        })
      ]

      for (const [rowIndex, experienceField] of this.contentsExperienceFields.entries()) {
        const children = [
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: this.justifyText ? docx.AlignmentType.JUSTIFIED : void 0,
                style: 'tableCellBold',
                text: `${rowIndex + 1}. ${experienceField}`
              })
            ]
          })
        ]

        children.push(
          new docx.TableCell({
            children: this.curriculum.experienceFields[experienceField].contents
              .map((content: string, contentIndex: number) => {
                const contentResult = []

                if (contentIndex > 0) {
                  contentResult.push(new docx.Paragraph({}))
                }

                contentResult.push(
                  this.bnccData.contentsByCode[content].objectives.map(
                    (objective: string, objectiveIndex: number) =>
                      new docx.Paragraph({
                        alignment: this.justifyText ? docx.AlignmentType.JUSTIFIED : void 0,
                        style: 'tableCellNormal',
                        text: `${objectiveIndex === 0 ? '(' + content + ') ' : ''}${objective}`
                      })
                  )
                )

                return contentResult.flat()
              })
              .flat()
          })
        )

        children.push(
          new docx.TableCell({
            children: this.curriculum.experienceFields[experienceField].strategies
              .replace(/\r/g, '')
              .split('\n')
              .map(
                (strategy: string) =>
                  new docx.Paragraph({
                    alignment: this.justifyText ? docx.AlignmentType.JUSTIFIED : void 0,
                    style: 'tableCellNormal',
                    text: strategy
                  })
              )
          })
        )

        if (rowIndex === 0) {
          children.push(
            new docx.TableCell({
              children: this.curriculum.assessment
                .replace(/\r/g, '')
                .split('\n')
                .map(
                  (assessmentLine: string) =>
                    new docx.Paragraph({
                      alignment: this.justifyText ? docx.AlignmentType.JUSTIFIED : void 0,
                      style: 'tableCellNormal',
                      text: assessmentLine
                    })
                ),
              rowSpan: this.contentsExperienceFields.length
            })
          )
        }

        rows.push(
          new docx.TableRow({
            children
          })
        )
      }

      const pageSize = this.landscape
        ? this.documentOptions.page.height
        : this.documentOptions.page.width
      const pageMargin = this.documentOptions.margin.horizontal
      const columnWidth = (pageSize - pageMargin * 2) * 0.25
      const table = new docx.Table({
        rows,
        columnWidths: [
          docx.convertMillimetersToTwip(columnWidth),
          docx.convertMillimetersToTwip(columnWidth),
          docx.convertMillimetersToTwip(columnWidth),
          docx.convertMillimetersToTwip(columnWidth)
        ]
      })

      const marginHorizontal = this.documentOptions.margin.horizontal
      const marginVertical = this.documentOptions.margin.vertical
      const doc = new docx.Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  bottom: docx.convertMillimetersToTwip(marginVertical),
                  left: docx.convertMillimetersToTwip(marginHorizontal),
                  right: docx.convertMillimetersToTwip(marginHorizontal),
                  top: docx.convertMillimetersToTwip(marginVertical)
                },
                size: {
                  orientation: this.landscape
                    ? docx.PageOrientation.LANDSCAPE
                    : docx.PageOrientation.PORTRAIT
                }
              }
            },
            children: [table]
          }
        ],
        styles: {
          paragraphStyles: [
            {
              basedOn: 'Normal',
              id: 'tableHeaderText',
              name: 'Table Header Text',
              next: 'Normal',
              run: {
                bold: true,
                font: {
                  name: 'Arial'
                },
                size: 24
              }
            },
            {
              basedOn: 'Normal',
              id: 'tableHeaderSubText',
              name: 'Table Header Sub Text',
              next: 'Normal',
              run: {
                font: {
                  name: 'Arial'
                },
                size: 22
              }
            },
            {
              basedOn: 'Normal',
              id: 'tableCellNormal',
              name: 'Table Cell Normal',
              next: 'Normal',
              run: {
                font: {
                  name: 'Arial'
                },
                size: 22
              }
            },
            {
              basedOn: 'Normal',
              id: 'tableCellBold',
              name: 'Table Cell Bold',
              next: 'Normal',
              run: {
                bold: true,
                font: {
                  name: 'Arial'
                },
                size: 22
              }
            }
          ]
        }
      })

      docx.Packer.toBlob(doc).then((blob) => saveAs(blob, 'Currículo BNCC.docx'))
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
    importBase64() {
      let dataToImport = null
      let showError = false

      try {
        dataToImport = JSON.parse(atob(this.importBase64Text.trim()))

        const validKeys = [
          'curriculum',
          'forPrinting',
          'justifyText',
          'landscape',
          'selectedAgeGroup',
          'selectedArea',
          'selectedContent',
          'selectedExperienceField'
        ]

        for (const key of validKeys) {
          if (Object.prototype.hasOwnProperty.call(dataToImport, key)) {
            continue
          }

          throw new Error(`Expected key ${key} not found`)
        }

        for (const key of Object.getOwnPropertyNames(dataToImport)) {
          if (validKeys.includes(key)) {
            continue
          }

          throw new Error(`Extra key ${key} found`)
        }

        const selectedArea = dataToImport.selectedArea

        if (selectedArea !== null && !this.bnccData.areas.includes(selectedArea)) {
          throw new Error(`Invalid selectedArea: ${selectedArea}`)
        }

        const selectedAgeGroup = dataToImport.selectedAgeGroup

        if (selectedAgeGroup !== null && !this.bnccData.ageGroups.includes(selectedAgeGroup)) {
          throw new Error(`Invalid selectedAgeGroup: ${selectedAgeGroup}`)
        }

        const selectedExperienceField = dataToImport.selectedExperienceField

        if (
          selectedExperienceField !== null &&
          !this.bnccData.experienceFields.includes(selectedExperienceField)
        ) {
          throw new Error(`Invalid selectedExperienceField: ${selectedExperienceField}`)
        }

        const selectedContent = dataToImport.selectedContent

        if (
          selectedContent !== null &&
          !Object.keys(this.bnccData.contentsByCode).includes(selectedContent)
        ) {
          throw new Error(`Invalid selectedContent: ${selectedContent}`)
        }

        const curriculum = dataToImport.curriculum

        if (curriculum !== Object(curriculum)) {
          throw new Error(`Invalid curriculum: ${curriculum}`)
        }

        const assessment = curriculum.assessment

        if (assessment !== null && typeof assessment !== 'string') {
          throw new Error(`Invalid assessment: ${assessment}`)
        }

        const experienceFields = curriculum.experienceFields

        if (experienceFields !== Object(experienceFields)) {
          throw new Error(`Invalid curriculum experienceFields: ${experienceFields}`)
        }

        for (const key of Object.keys(experienceFields)) {
          if (!this.bnccData.experienceFields.includes(key)) {
            throw new Error(`Invalid curriculum experienceField: ${key}`)
          }

          const experienceField = experienceFields[key]
          const strategies = experienceField.strategies

          if (strategies !== null && typeof strategies !== 'string') {
            throw new Error(`Invalid curriculum experienceField strategies: ${strategies}`)
          }

          const contents = experienceField.contents

          if (!Array.isArray(contents)) {
            throw new Error(`Invalid curriculum experienceField contents: ${contents}`)
          }

          for (const content of contents) {
            if (Object.prototype.hasOwnProperty.call(this.bnccData.contentsByCode, content)) {
              continue
            }

            throw new Error(`Invalid curriculum experienceField content: ${content}`)
          }
        }

        const forPrinting = dataToImport.forPrinting

        if (typeof forPrinting !== 'boolean') {
          throw new Error(`Invalid forPrinting: ${forPrinting}`)
        }

        const justifyText = dataToImport.justifyText

        if (typeof justifyText !== 'boolean') {
          throw new Error(`Invalid justifyText: ${justifyText}`)
        }

        const landscape = dataToImport.landscape

        if (typeof landscape !== 'boolean') {
          throw new Error(`Invalid landscape: ${landscape}`)
        }
      } catch (e) {
        showError = true
      }

      this.importBase64Text = null

      if (showError) {
        this.$q.notify({
          color: 'negative',
          icon: 'error',
          message: 'Erro ao importar base64',
          position: 'bottom-left',
          timeout: 3000
        })

        return
      }

      this.selectedArea = dataToImport.selectedArea
      this.selectedAgeGroup = dataToImport.selectedAgeGroup
      this.selectedExperienceField = dataToImport.selectedExperienceField
      this.selectedContent = dataToImport.selectedContent

      this.curriculum = dataToImport.curriculum

      this.forPrinting = dataToImport.forPrinting
      this.justifyText = dataToImport.justifyText
      this.landscape = dataToImport.landscape
    },
    removeContent(experienceField: string, content: string) {
      if (
        Object.prototype.hasOwnProperty.call(this.curriculum.experienceFields, experienceField) ===
        false
      ) {
        return
      }

      const experienceFieldContents = this.curriculum.experienceFields[experienceField].contents
      const contentIndex = experienceFieldContents.indexOf(content)

      if (contentIndex === -1) {
        return
      }

      experienceFieldContents.splice(contentIndex, 1)

      if (experienceFieldContents.length > 0) {
        return
      }

      delete this.curriculum.experienceFields[experienceField]
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
  beforeCreate() {
    this.$q.dark.set(true)
  },
  mounted() {
    fetch('data.json')
      .then((response) => response.json())
      .then((json) => {
        this.bnccData = json

        const selectedArea = window.localStorage.getItem('selectedArea')

        if (selectedArea) {
          this.selectedArea = selectedArea
        }

        const selectedAgeGroup = window.localStorage.getItem('selectedAgeGroup')

        if (selectedAgeGroup) {
          this.selectedAgeGroup = selectedAgeGroup
        }

        const selectedExperienceField = window.localStorage.getItem('selectedExperienceField')

        if (selectedExperienceField) {
          this.selectedExperienceField = selectedExperienceField
        }

        const selectedContent = window.localStorage.getItem('selectedContent')

        if (selectedContent) {
          this.selectedContent = selectedContent
        }

        const curriculum = window.localStorage.getItem('curriculum')

        if (curriculum) {
          this.curriculum = JSON.parse(curriculum)
        }

        const forPrinting = window.localStorage.getItem('forPrinting')

        if (forPrinting) {
          this.forPrinting = Boolean(Number(forPrinting))
        }

        const justifyText = window.localStorage.getItem('justifyText')

        if (justifyText) {
          this.justifyText = Boolean(Number(justifyText))
        }

        const landscape = window.localStorage.getItem('landscape')

        if (landscape) {
          this.landscape = Boolean(Number(landscape))
        }

        setTimeout(() => {
          if (selectedArea && selectedAgeGroup && selectedExperienceField) {
            this.$refs.content.focus()
          } else {
            this.$refs.area.focus()
          }
        }, 0)
      })
      .catch(() => (this.error = true))
      .finally(() => (this.loading = false))
  }
}
</script>

<template>
  <q-card class="q-pa-md flex flex-center no-shadow" v-if="loading">
    <q-circular-progress indeterminate rounded size="50px" color="lime" class="q-ma-md" />
  </q-card>

  <q-card class="q-pa-md flex flex-center" v-if="error">Erro carregando dados</q-card>

  <q-card class="no-shadow" v-if="!loading && !error">
    <q-select
      emit-value
      label="Área"
      outlined
      ref="area"
      v-model="selectedArea"
      :disable="hasContents"
      :options="areaOptions"
    />

    <q-select
      class="q-mt-sm"
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
          <q-item-section class="text-grey">Nenhum resultado</q-item-section>
        </q-item>
      </template>
    </q-select>
  </q-card>

  <q-dialog persistent v-if="!loading && !error" v-model="confirmClearAll">
    <q-card class="no-shadow">
      <q-card-section class="row items-center">
        <q-avatar color="negative" icon="error" text-color="white" />

        <span class="q-ml-sm">Tem certeza de que deseja limpar tudo?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="positive" flat label="Não" v-close-popup />

        <q-btn color="negative" flat label="Sim" v-close-popup @click="clearAll" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <div class="q-mt-md row justify-end" v-if="!loading && !error && selectedExperienceField">
    <q-btn
      class="q-mr-sm"
      color="negative"
      label="Limpar"
      :disable="!hasContents"
      @click="confirmClearAll = true"
    />

    <q-btn color="primary" label="Adicionar" :disable="!selectedContent" @click="addContent" />
  </div>

  <q-dialog class="dialog-base64-import" v-if="!loading && !error" v-model="confirmImportBase64">
    <q-card class="no-shadow">
      <q-card-section class="row items-center">
        <q-avatar color="primary" icon="code" text-color="white" />

        <span class="q-ml-sm">Cole aqui o base64:</span>
      </q-card-section>

      <q-card-section>
        <q-input autofocus dense filled type="textarea" v-model="importBase64Text" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="negative" flat label="Cancelar" v-close-popup />

        <q-btn color="positive" flat label="Importar" v-close-popup @click="importBase64" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-card class="q-mt-md no-shadow" v-if="!loading && !error">
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

    <q-tab-panels animated v-model="tab">
      <q-tab-panel name="informations">
        <q-expansion-item
          group="informations"
          label="Direitos de aprendizagem"
          header-class="text-teal"
        >
          <q-card>
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
          <q-card>
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
          <q-card>
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
          <q-card>
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
          <q-card>
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
          <q-card>
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
          <q-card>
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
        <div class="q-mb-md row">
          <q-btn-dropdown color="orange" label="Opções">
            <q-list bordered>
              <q-item>
                <q-item-section no-wrap side>
                  <q-toggle
                    class="q-mr-sm"
                    color="orange"
                    icon="print"
                    keep-color
                    label="Modo impressão"
                    v-model="forPrinting"
                    :disable="!hasContents"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section no-wrap side>
                  <q-toggle
                    color="orange"
                    icon="format_align_justify"
                    keep-color
                    label="Texto justificado"
                    v-model="justifyText"
                    :disable="!hasContents"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section no-wrap side>
                  <q-toggle
                    color="orange"
                    icon="landscape"
                    keep-color
                    label="Modo paisagem"
                    v-model="landscape"
                    :disable="!hasContents"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-space />

          <q-btn-dropdown color="primary" label="Importar">
            <q-list bordered>
              <q-item clickable v-close-popup @click="confirmImportBase64 = true">
                <q-item-section side>
                  <q-icon name="code" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>Base64</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown class="q-ml-sm" color="green" label="Exportar" :disable="!hasContents">
            <q-list bordered>
              <q-item clickable v-close-popup :disable="!forPrinting" @click="selectContentsTable">
                <q-item-section side>
                  <q-icon name="select_all" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>Selecionar apenas</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup :disable="!forPrinting" @click="copyContentsTable">
                <q-item-section side>
                  <q-icon name="content_copy" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>Área de transferência</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="exportDocx">
                <q-item-section side>
                  <q-icon name="description" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>DOCX</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="exportBase64">
                <q-item-section side>
                  <q-icon name="code" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>Base64</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <div :class="['contents-table-wrapper', { print: forPrinting }]">
          <table
            cellpadding="0"
            cellspacing="0"
            class="contents-table"
            v-if="hasContents"
            :class="{ print: forPrinting }"
          >
            <thead>
              <th>
                <span class="text-weight-bold">CAMPO DE EXPERIÊNCIA</span>
              </th>

              <th>
                <span class="text-weight-bold">OBJETIVOS DE APRENDIZAGEM</span>

                <span>(Habilidades: o que a criança vai aprender)</span>
              </th>

              <th>
                <span class="text-weight-bold">ESTRATÉGIAS</span>

                <span>(Como ensinar/metodologia)</span>
              </th>

              <th>
                <span class="text-weight-bold">AVALIAÇÃO</span>

                <span>(Monitorar/Analisar)</span>
              </th>
            </thead>

            <tbody>
              <tr
                v-for="(
                  contentExperienceField, contentExperienceFieldIndex
                ) in contentsExperienceFields"
                :key="contentExperienceField"
              >
                <td :class="['text-weight-bold', { 'text-justify': justifyText }]">
                  {{ contentExperienceFieldIndex + 1 }}. {{ contentExperienceField }}
                </td>

                <td :class="{ 'text-justify': justifyText }">
                  <div
                    v-for="content in curriculum.experienceFields[contentExperienceField].contents"
                    :key="content"
                  >
                    <q-btn
                      color="negative"
                      dense
                      icon="delete"
                      round
                      size="sm"
                      v-if="!forPrinting"
                      @click="removeContent(contentExperienceField, content)"
                    />

                    <span>
                      ({{ content }}) {{ bnccData.contentsByCode[content].objectives[0] }}
                    </span>
                  </div>
                </td>

                <td :class="{ 'text-justify': forPrinting && justifyText }">
                  <q-input
                    dense
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
                  :class="{ 'text-justify': forPrinting && justifyText }"
                  :rowspan="Object.keys(curriculum.experienceFields).length"
                >
                  <q-input
                    dense
                    filled
                    type="textarea"
                    v-model="curriculum.assessment"
                    v-if="!forPrinting"
                  />

                  <span class="span-pre" v-else v-text="curriculum.assessment"></span>
                </td>
              </tr>
            </tbody>
          </table>

          <span v-else>Nenhum conteúdo adicionado</span>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<style lang="scss" scoped>
.bncc-paragraph {
  text-indent: 2cm;
}

.contents-table-wrapper.print {
  background: #fff;
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

        &:not(:first-of-type) {
          font-size: 11px;
        }
      }
    }
  }

  td {
    border: 0.5px solid #fff;
    vertical-align: top;

    > div {
      display: flex;
      align-items: center;
      column-gap: 10px;

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
  white-space: pre-wrap;
}
</style>
