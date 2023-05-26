<script lang="ts">
export default {
  data(): any {
    return {
      bnccData: null,
      error: false,
      filteredContentOptions: null,
      loading: true,
      selectedAgeGroup: null,
      selectedArea: null,
      selectedContent: null,
      selectedExperienceField: null
    };
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
    },
    areaOptions(): any[] {
      return this.bnccData.areas
        .map((area: any) => {
          return {
            label: area,
            value: area
          }
        })
    },
    contentOptions(): any[] {
      return this.bnccData.contentsByAgeGroupAndExperienceField[this.selectedAgeGroup][this.selectedExperienceField]
        .map((content: any) => {
          const objective = this.bnccData.contentsByCode[content].objectives[0];

          return {
            label: `(${content}) ${objective}`,
            value: content
          }
        })
    },
    experienceFieldOptions(): any[] {
      return this.bnccData.experienceFields
        .map((experienceField: any) => {
          return {
            label: experienceField,
            value: experienceField
          }
        })
    },
    selectedContentLabel(): string {
      if(!this.selectedContent) {
        return ""
      }

      const objective = this.bnccData.contentsByCode[this.selectedContent].objectives[0];

      return `(${this.selectedContent}) ${objective}`
    }
  },
  methods: {
    filterContents(value: string, update: Function) {
      if(value === "") {
        update(() => {
          this.filteredContentOptions = this.contentOptions
          this.selectedContent = null
        })

        return
      }

      update(() => {
        const needles = value.toLocaleLowerCase().split(" ").filter(needle => needle.length > 0);

        this.filteredContentOptions = this.contentOptions.filter((v: any) => {
          let found = 0;

          for(const needle of needles) {
            const label = v.label.toLocaleLowerCase()

            if(label.indexOf(needle) === -1) {
              continue
            }

            found++;
          }

          return (found === needles.length)
        })
      })
    }
  },
  mounted() {
    fetch('data.json')
      .then(response => response.json())
      .then(json => {
        this.bnccData = json
      })
      .catch(() => this.error = true)
      .finally(() => this.loading = false)
  }
}
</script>

<template>
  <div class="q-pa-md flex flex-center" v-if="loading">
    <q-circular-progress
      indeterminate
      rounded
      size="50px"
      color="lime"
      class="q-ma-md"
    />
  </div>

  <div class="q-pa-md flex flex-center" v-if="error">
    Erro carregando dados
  </div>

  <div v-if="!loading && !error">
    <q-select
      dark
      emit-value
      label="Área"
      outlined
      v-model="selectedArea"
      :options="areaOptions" />

    <q-select
      dark
      emit-value
      label="Idade"
      outlined
      v-if="selectedArea"
      v-model="selectedAgeGroup"
      :options="ageGroupOptions" />

    <q-select
      dark
      emit-value
      label="Campo de Experiência"
      outlined
      v-if="selectedArea && selectedAgeGroup"
      v-model="selectedExperienceField"
      :options="experienceFieldOptions" />

    <q-select
      clearable
      dark
      emit-value
      filtered
      input-debounce="0"
      label="Conteúdo"
      outlined
      use-input
      v-if="selectedArea && selectedAgeGroup && selectedExperienceField"
      v-model="selectedContent"
      :display-value="selectedContentLabel"
      :options="filteredContentOptions"
      @filter="filterContents"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            Nenhum resultado
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-expansion-item
      dark
      label="Informações do conteúdo"
      outlined
      v-if="selectedArea && selectedAgeGroup && selectedExperienceField && selectedContent"
      :caption="selectedContent"
    >
      <q-card dark>
        <q-card-section class="column">
          <span class="text-weight-bold">
            Código:
          </span>

          <span>
            {{ selectedContent }}
          </span>

          <span class="text-weight-bold q-mt-md">
            Objetivos:
          </span>

          <span v-for="objective in bnccData.contentsByCode[selectedContent].objectives" :key="objective">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ objective }}
          </span>

          <span class="text-weight-bold q-mt-md">
            Abordagens:
          </span>

          <span v-for="approach in bnccData.contentsByCode[selectedContent].approaches" :key="approach">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ approach }}
          </span>

          <span class="text-weight-bold q-mt-md">
            Sugestões:
          </span>

          <span v-for="suggestion in bnccData.contentsByCode[selectedContent].suggestions" :key="suggestion">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ suggestion }}
          </span>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <div class="column" v-if="selectedArea && selectedAgeGroup && selectedExperienceField && selectedContent">
      <span class="text-weight-bold q-mt-md">
        Código:
      </span>

      <span>
        {{ selectedContent }}
      </span>

      <span class="text-weight-bold q-mt-md">
        Objetivos:
      </span>

      <span v-for="objective in bnccData.contentsByCode[selectedContent].objectives" :key="objective">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ objective }}
      </span>

      <span class="text-weight-bold q-mt-md">
        Abordagens:
      </span>

      <span v-for="approach in bnccData.contentsByCode[selectedContent].approaches" :key="approach">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ approach }}
      </span>

      <span class="text-weight-bold q-mt-md">
        Sugestões:
      </span>

      <span v-for="suggestion in bnccData.contentsByCode[selectedContent].suggestions" :key="suggestion">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ suggestion }}
      </span>
    </div>
  </div>
</template>

<style scoped>

</style>
