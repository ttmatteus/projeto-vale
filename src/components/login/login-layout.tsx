"use client";

import { ReactNode, useState, useEffect } from "react";
import styles from "./login-layout.module.css";

interface LoginLayoutProps {
  children: ReactNode;
}

export function LoginLayout({ children }: LoginLayoutProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const images = ["/foto1.png", "/foto2.png", "/foto3.png"];
  const texts = [
    "Gerencie seus lotes de forma inteligente e eficiente",
    "Controle total sobre vendas e clientes",
    "Sistema completo de gestão imobiliária"
  ];

  const cardData = [
    {
      title: "Venda de Imóveis",
      subtitle: "25 Lotes Disponíveis",
      progress: 90,
      label: "Concluído"
    },
    {
      title: "Gestão de Clientes",
      subtitle: "150 Clientes Ativos",
      progress: 75,
      label: "Em Andamento"
    },
    {
      title: "Relatórios",
      subtitle: "30 Relatórios Gerados",
      progress: 100,
      label: "Finalizado"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setProgressValue(0); // Reset progress
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setIsTransitioning(false);
      }, 300);
    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(interval);
  }, [images.length]);

  // Animate progress when image changes
  useEffect(() => {
    const targetProgress = cardData[currentImageIndex].progress;
    const duration = 1500; // 1.5 seconds
    const steps = 60; // 60 steps for smooth animation
    const stepDuration = duration / steps;
    const progressIncrement = targetProgress / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setProgressValue(Math.min(progressIncrement * currentStep, targetProgress));
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [currentImageIndex]);

  const goToSlide = (index: number) => {
    if (index === currentImageIndex) return;
    
    setIsTransitioning(true);
    setProgressValue(0); // Reset progress
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        {children}
      </div>
      <div className={styles.rightSection}>
        <div className={styles.carouselContainer}>
          <div className={styles.imageWrapper}>
            {images.map((image, index) => (
              <div key={index} className={`${styles.imageContainer} ${
                index === currentImageIndex ? styles.activeImage : styles.inactiveImage
              }`}>
                <img 
                  src={image} 
                  alt="Sistema de Gestão de Lotes" 
                  className={styles.loginImage}
                />
                
                {/* Card sobreposto */}
                        <div className={`${styles.overlayCard} ${
                          index === 1 ? styles.overlayCardMedium : 
                          index === 2 ? styles.overlayCardLower : ''
                        }`}>
                          <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>{cardData[currentImageIndex].title}</h3>
                            <p className={styles.cardSubtitle}>{cardData[currentImageIndex].subtitle}</p>
                            
                            <div className={styles.cardBottom}>
                              <button className={styles.cardButton}>Visitar</button>
                              
                              <div className={styles.progressContainer}>
                                <div className={styles.progressCircle} style={{
                                  background: `conic-gradient(#c8dac1 0deg ${progressValue * 3.6}deg, #000000 ${progressValue * 3.6}deg 360deg)`
                                }}>
                                  <div className={styles.progressArc}></div>
                                  <span className={styles.progressText}>{Math.round(progressValue)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
              </div>
            ))}
          </div>
          
          {/* Indicadores do carrossel */}
          <div className={styles.carouselIndicators}>
            {images.map((_, index) => (
              <button
                key={index}
                className={`${
                  index === images.length - 1 ? styles.rectangularIndicator : styles.indicator
                } ${
                  index === currentImageIndex ? styles.activeIndicator : ''
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Texto descritivo */}
            <div className={styles.carouselText}>
              <p className={styles.carouselDescription}>
                {texts[currentImageIndex]}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}
