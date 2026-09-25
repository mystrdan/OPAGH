import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { DeliveryQuote } from '../lib/logistics';

export default function OptionsScreen() {
  const p = useLocalSearchParams<Record<string, string | string[]>>();
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const n = (v: string | string[] | undefined) => Number(Array.isArray(v) ? v[0] : v);
    const a = n(p.pickupLatitude), b = n(p.pickupLongitude), c = n(p.destinationLatitude), d = n(p.destinationLongitude);
    if (![a,b,c,d].every(Number.isFinite)) { setError('Pickup and destination coordinates are required for provider pricing. JSI will not invent coordinates.'); setLoading(false); return () => { live = false; }; }
    if (!supabase) { setError('JSI is not connected to its backend.'); setLoading(false); return () => { live = false; }; }
    supabase.functions.invoke('dawurobo', { body: { action: 'estimate', pickup: { lat: a, lng: b }, delivery: { lat: c, lng: d } } }).then(({data,error:e}) => {
      if (!live) return;
      if (e || data?.error) { setError(e?.message || data?.error || 'Could not retrieve provider pricing.'); setLoading(false); return; }
      const x = data?.data ?? data;
      const amount = Number(x?.estimated_price ?? x?.estimatedPrice ?? x?.price);
      if (!Number.isFinite(amount) || amount <= 0) { setError('The provider did not return a valid delivery price.'); setLoading(false); return; }
      setQuote({ id:'dawurobo-standard', providerId:'dawurobo', providerName:'Dawurobo', serviceName:'Standard delivery', amount, currency:String(x?.currency ?? 'GHS'), etaMinutes:null, status:'available' });
      setLoading(false);
    });
    return () => { live = false; };
  }, [p.pickupLatitude,p.pickupLongitude,p.destinationLatitude,p.destinationLongitude]);
  return <View style={s.container}><View style={s.content}><Text style={s.eyebrow}>JSI · Just Send It</Text><Text style={s.title}>Delivery options</Text><Text style={s.subtitle}>Prices come from connected logistics providers.</Text>{loading ? <ActivityIndicator /> : error ? <View style={s.notice}><Text style={s.noticeTitle}>No quote yet</Text><Text style={s.noticeText}>{error}</Text></View> : quote ? <View style={s.card}><View style={s.info}><Text style={s.name}>{quote.serviceName}</Text><Text style={s.provider}>{quote.providerName}</Text><Text style={s.price}>{quote.currency} {quote.amount?.toFixed(2)}</Text></View><Pressable style={s.select} onPress={() => router.push({pathname:'/checkout',params:{...p,quoteId:quote.id,providerId:quote.providerId,quoteAmount:String(quote.amount),quoteCurrency:quote.currency}})}><Text style={s.selectText}>Select</Text></Pressable></View> : <Text style={s.empty}>No delivery options are available.</Text>}</View></View>;
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:'#fff',padding:24},content:{width:'100%',maxWidth:650,alignSelf:'center',gap:16,paddingVertical:30},eyebrow:{fontSize:13,fontWeight:'700',letterSpacing:1.5},title:{fontSize:32,fontWeight:'800'},subtitle:{color:'#666',fontSize:16,lineHeight:24},card:{borderWidth:1,borderColor:'#ddd',borderRadius:12,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:16},info:{flex:1,gap:5},name:{fontSize:17,fontWeight:'700'},provider:{color:'#666'},price:{fontWeight:'700'},select:{backgroundColor:'#111',paddingHorizontal:18,paddingVertical:11,borderRadius:9},selectText:{color:'#fff',fontWeight:'700'},empty:{color:'#666'},notice:{borderWidth:1,borderColor:'#ddd',borderRadius:12,padding:18,gap:8},noticeTitle:{fontWeight:'800',fontSize:17},noticeText:{color:'#666',lineHeight:21}});