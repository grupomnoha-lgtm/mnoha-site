function loadChatHistory(user) {
        // Validación estricta: si no hay correo, usamos una alternativa limpia basada en su UID o evitamos el error
        const userEmailId = user.email ? user.email.trim().toLowerCase() : `user_${user.uid}`;
        const docRef = doc(db, "conversations", userEmailId);

        if (unsubscribeMessages) unsubscribeMessages();

        unsubscribeMessages = onSnapshot(docRef, async (docSnap) => {
            if (!chatMessages) return;
            
            chatMessages.innerHTML = '<div class="text-xs text-gray-500 text-center my-2">Canal de soporte directo MNOHA</div>';
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const messages = data.messages || [];

                messages.forEach((msg) => {
                    const isClient = msg.sender === 'client';
                    const msgDiv = document.createElement('div');
                    msgDiv.className = `message ${isClient ? 'sent' : 'received'}`;
                    msgDiv.innerHTML = `<p>${msg.text}</p>`;
                    chatMessages.appendChild(msgDiv);
                });
            } else {
                await setDoc(docRef, {
                    sessionId: user.uid,
                    userName: user.displayName || 'Cliente',
                    userEmail: user.email || userEmailId,
                    messages: [],
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, (error) => {
            console.error('Error al escuchar la conversación:', error);
        });
    }

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = currentUser || auth.currentUser;
            if (!user || !chatInput) return;

            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = ''; 
            
            const userEmailId = user.email ? user.email.trim().toLowerCase() : `user_${user.uid}`;
            const docRef = doc(db, "conversations", userEmailId);

            try {
                await updateDoc(docRef, {
                    messages: arrayUnion({
                        text: text,
                        sender: 'client',
                        createdAt: new Date().toISOString()
                    }),
                    updatedAt: serverTimestamp(),
                    userEmail: user.email || userEmailId,
                    userName: user.displayName || 'Cliente'
                });
            } catch (error) {
                console.error("Error al enviar mensaje:", error);
            }
        });
    }