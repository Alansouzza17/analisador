import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Step = {
  id: number;
  title: string;
  description: string;
  image: any;
};

const steps: Step[] = [

  {

    id: 1,
    title: "Vá no seu perfil",
    description: "Toque na sua foto de perfil no canto inferior direito.",
    image: require("../assets/images/passo1.jpg"),
  },
  {
    id: 2,
    title: "Abra o menu",
    description: "Toque nas três linhas no canto superior direito.",
    image: require("../assets/images/passo2.jpg"),
  },
  {
    id: 3,
    title: "Entre na Central de Contas",
    description: "Toque em Central de Contas para acessar as opções da conta.",
    image: require("../assets/images/passo3.jpg"),
  },
  {
    id: 4,
    title: "Suas informações e permissões",
    description: "Entre na opção Suas informações e permissões.",
    image: require("../assets/images/passo4.jpg"),
  },
  {
    id: 5,
    title: "Exportar suas informações",
    description: "Toque em exportar suas informações.",
    image: require("../assets/images/passo5.jpg"),
  },
  
  {
    id: 6,
    title: "Criar exportação",
    description: "Clique em criar exportação e depois escolha seu perfil.",
    image: require("../assets/images/passo6.jpg"),
  },
  
  {
    id: 7,
    title: "Exportar para dispositivo",
    description: "Clique em exportar para dispositivo.",
    image: require("../assets/images/passo7.jpg"),
  },
  
  {
    id: 8,
    title: "Personalizar informações",
    description: "Clique em personalizar informações.",
    image: require("../assets/images/passo8.jpg"),
  },

  {
     id: 9,
     title: "Limpe todas as caixas",
     description: "Deixe marcado apenas a opção Seguidores e Seguindo, e salve",
     image: require("../assets/images/passo9.jpg"),
   },
 
  {
    id: 10,
    title: "Intervalo de datas.",
    description:
      "Na data, selecione Desde o início para baixar a lista completa, e salve.",
    image: require("../assets/images/passo10.jpg"),
  },

  {
    id: 11,
    title: "Formato",
    description: "Escolha o formato JSON , e salve.",
    image: require("../assets/images/passo11.jpg"),
  },

  {
    id: 12,
    title: "Iniciar exportação",
    description: "Clique em Iniciar exportação e aguarde o instagram gerar o arquivo para download.",
    image: require("../assets/images/passo12.jpg"),
  },
 
];

export default function ComoImportarScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>Como importar</Text>
            <Text style={styles.headerSubtitle}>
              Passo a passo com imagens
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color="#1E40AF" />
          <Text style={styles.infoText}>
            Use o formato <Text style={styles.bold}>JSON</Text> e escolha{" "}
            <Text style={styles.bold}>Desde o início</Text> para importar a
            lista completa.
          </Text>
        </View>

        {steps.map((step) => (
          <View key={step.id} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{step.id}</Text>
              </View>

              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>

            <Image
              source={step.image}
              style={styles.stepImage}
              resizeMode="cover"
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
        >
          <Text style={styles.doneButtonText}>Voltar para importação</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F4F6",
  },

  header: {
    paddingBottom: 22,
  },

  headerContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#151515",
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#1F1F1F",
    opacity: 0.85,
  },

  content: {
    padding: 20,
    paddingBottom: 32,
  },

  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 19,
  },

  bold: {
    fontWeight: "800",
  },

  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FCE7F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  stepBadgeText: {
    color: "#d62976",
    fontWeight: "800",
    fontSize: 16,
  },

  stepHeaderText: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#151515",
    marginBottom: 4,
  },

  stepDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  stepImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#EEE",
  },

  doneButton: {
    backgroundColor: "#E1267D",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },

  doneButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});