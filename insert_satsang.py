from db_config import get_db_connection

# 🌿 Define satsang content
marathi_content = ''' जीवनात मनुष्यांच्या हातून शुभ व अशुभ कर्म कळत नकळत होत असते. त्याचे फळ देखील त्या कर्मा बरोबरच जोडलेले आहे. शुभ कर्म/ छान कर्म केल्याने त्याचे फळ ह्याच जीवनात मिळतें, तुम्हास सुखी जीवन प्राप्त होते. तसेच अशुभ कर्म केल्याने त्याचे फळ देखील ह्याच जीवनात भोगावे लागते. कर्म करावयास परमेश्वराने सर्व जीवास स्वतंत्रता दिली आहे. कर्मा प्रमाणे सर्वांना फळ ह्याच जीवनात मिळते. त्यात परमेश्वराचे अजिबात हस्तक्षेप नसते. तुम्ही देवासमोर कितीही प्रार्थना करा कर्मा प्रमाणे फळ लागूनच असते व ते भोगावेच लागते. पुण्य, शुभ कर्म केल्याने मिळते व त्याचे फळ म्हणून सुखी जीवन प्राप्त होते. हिंदू सनातन धर्मात एक कुटुंबास फार महत्व दिले आहे, तसेच एक पत्नीव्रत /सतिवृता असणे फार आवश्यक व अध्यत्मिक दृष्टीने अतिशय महत्वाचे आहे. जर कुटुंबा पैकी कोणीही व्यक्ती बाह्य अनैतिक संबंध ठेवले तर त्या माध्यमातून त्या कुटुंबात पाप कर्म आपोआपच संचित/ हस्तांतरीत होतात व त्याचे परिणाम त्या कुटुंबास भोगावे लागतात. हया कारणाने हिंदू धर्मात एक पत्नीव्रत/सतिवृत असणे फार आवश्यक आहे. नसता त्याचे परिणाम दुखदायी असतात. सद्गुरूंनी स्पष्टपने सांगितल आहे की पर-स्त्री पासून सावधान असावे त्याचे कारणं म्हणजे, परस्त्रीसी संबंध ठेवल्याने त्या व्यक्तीचे सर्व पापकर्म नकळत आपोआपच हस्तांतरित होतात. त्याचे फळ त्या पुरुषास व स्त्रीस भोगावे लागतात. म्हणूनच राम ऊत्तम परम पुरूष संबोधिले जातात कारणं ते शेवट पर्यंत एक पत्नीव्रत होतें. अध्यत्मात उच्चतम शिखर गाठण्यासाठी एक पत्नीव्रत असणे फार आवश्यक आहे. हेच ब्रह्मचर्य आहे. तसेच गुरुशी देखील एकनिष्टता असणे फार आवश्यक आहे तरच तुमची आत्मप्रगती होते व शेवटच्या क्षणी आत्म्दर्शन/ परमेश्वराचे दर्शन घडते. स्वतःच्या आत्म्यावर निष्ठा असणे अती आवश्यक आहे, तरच परमेश्वराचे दर्शन घडते. सद्गुरू कडे मनुष्य ह्याच उद्देशाने जातो की त्यांच्या आशिर्वादाने सर्व पाप कर्म शुद्ध व्हावे म्हणून. सद्गुरू आपल्या योग शक्तीने, ध्यान अग्निने भक्तांचे सर्व दुःख पापाचे निवारण करतात. चित्त शुध्दी होऊन नंतर आत्म्प्रगती साठी आम्ही योग्य होतो. जेंव्हा आम्ही त्यांचें चरण स्पर्श करतो त्यासंग आमचे सर्व अवगुण सद्गुरू स्वीकार करून ते आशिर्वाद रूपाने आमचं अंतःकरण शुद्ध करून टाकतात. जगात सद्गुरुंचे स्थान हे एकच आहे जेथे तुमचे सर्व कर्म शुद्ध होऊन अध्यात्मात व संसारात प्रगति करू शकतो. हया व्यतिरिक्त दुसरें स्थान जे आहेत ते फक्त संसारातील इच्छा पूर्ण करण्यासाठी '''
english_content = ''' In life, humans unknowingly perform both good and bad deeds. The fruits of these deeds are intertwined with them. Good deeds yield their rewards in this very life, leading to a happy existence, while bad deeds also have consequences that must be endured in this life. God has granted all living beings the freedom to act, and everyone receives rewards appropriate to their deeds in this life; there is no divine interference in this. No matter how much you pray to God, the results are tied to your actions, and you must experience them. Merit and happiness come from performing good deeds. In Hindu Sanatan Dharma, great importance is placed on the concept of family, and being devoted to one’s wife is considered essential and profoundly significant from a spiritual perspective. If any member of the family engages in unethical external relationships, the sins naturally accumulate or transfer within that family, and its members have to face the consequences. For this reason, it is crucial to uphold the principle of having a single wife or being devoted to one’s spouse in Hinduism; otherwise, the results can be unfortunate. The Satguru (spiritual teacher) has clearly stated that one must be cautious around other women, because engaging with them can unknowingly result in all of one’s sins transferring. The outcomes of these actions must be experienced by both the man and the woman. Hence, Rama is referred to as the supreme person, as he adhered to the vow of a single wife until the end. To reach the highest peak in spirituality, being committed to one wife is essential; this is also the essence of Brahmacharya (celibacy). Moreover, having unwavering faith in the Guru is necessary for personal progress, allowing for a vision of the Self or God in the end. Dedication to one’s own soul is critically important, as this leads to the realization of God. People approach the Satguru with the intention that through their blessings, all sins may be purified. The Satguru, through their yogic powers and the fire of meditation, alleviates all the devotees' pains and sins. Once the mind is purified, we become eligible for spiritual progress. When we touch their feet, the Satguru accepts all our flaws and purifies our inner selves through their blessings. In this world, the place of the Satguru is unique, where all your deeds can be cleansed, allowing progress in spirituality and worldly matters. Besides this, other places exist only for the fulfillment of worldly desires. 🪷🌺🕉🙏🏻  '''

# 🌸 Satsang metadata
page_number = 1
title = 'शुभ कर्म व अशुभ कर्म'
author = 'प.पु.श्री.अशोककाका शास्त्री'
date = '2025-08-17'
is_active = 1

# 🚀 Insert query
insert_query = """
    INSERT INTO satsang (
        page_number,
        title,
        content,
        content_en,
        author,
        date,
        is_active
    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

# 🔧 Execute insert
try:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(insert_query, (
        page_number,
        title,
        marathi_content,
        english_content,
        author,
        date,
        is_active
    ))
    conn.commit()
    print("✅ Satsang inserted successfully.")
except Exception as e:
    print("❌ Error inserting satsang:", e)
finally:
    conn.close()
