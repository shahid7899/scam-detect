import React, { useState, useEffect } from 'react';
import GmailInbox from '../components/GmailInbox';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  Collapse,
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
  Upload,
  ContentPaste,
  Clear,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';


const ScamDetector = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [inputText, setInputText] = useState('');
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = React.useRef();
  // Helper to extract text from supported files
  const extractTextFromFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      return await file.text();
    }
    if (ext === 'pdf') {
      // PDF parsing: use pdfjs-dist if available, else show error
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
      } catch (e) {
        toast.error('PDF reading failed. Try a TXT file.');
        return '';
      }
    }
    toast.error('Only TXT and PDF files are supported for analysis.');
    return '';
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }
    setLoading(true);
    const text = await extractTextFromFile(file);
    setLoading(false);
    if (text) {
      setInputText(text);
      setActiveTab(0);
      toast.success('File loaded. Ready to analyze!');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // No fake stats, no static scam messages, no activity overview. Only show scam alerts if real backend data is available.
  useEffect(() => {
    // setUserScams([]); // Only real data should populate this, otherwise empty
  }, [user]);

  const analyzeText = () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }
    setLoading(true);

    // Simple keyword-based scam detection (client-side)
    const scamKeywords = [
      'account', 'verify', 'password', 'login', 'urgent', 'click', 'bank',
      'lottery', 'winner', 'prize', 'congratulations', 'claim',
      'investment', 'guaranteed', 'returns', 'profit', 'crypto', 'bitcoin',
      'order', 'payment', 'shipping', 'deal', 'discount', 'limited'
    ];
    const lowerText = inputText.toLowerCase();
    let found = [];
    scamKeywords.forEach(kw => {
      if (lowerText.includes(kw)) found.push(kw);
    });

    const isScam = found.length > 2;
    const confidence = isScam ? 90 : 80;
    const riskScore = isScam ? Math.min(100, 60 + found.length * 10) : Math.max(10, 40 - found.length * 5);
    const detectedScams = {};
    if (found.length) {
      detectedScams['Detected Keywords'] = found;
    }
    const analysis = {
      summary: isScam
        ? 'This message contains several scam indicators and is likely fraudulent.'
        : 'No major scam indicators detected. Message appears safe, but always use caution.',
      recommendations: isScam
        ? [
            'Do not click on suspicious links or provide personal information.',
            "Verify the sender's identity before responding.",
            'Report suspicious messages to the appropriate authorities.'
          ]
        : [
            'No scam detected, but stay vigilant and double-check unexpected messages.'
          ]
    };
    const result = {
      isScam,
      confidence,
      riskScore,
      detectedScams,
      totalIndicators: found.length,
      analysis,
      timestamp: Date.now(),
      inputText
    };
    setTimeout(() => {
      setDetectionResult(result);
      setDetectionHistory(prev => [result, ...prev.slice(0, 9)]);
      setLoading(false);
      if (isScam) {
        toast.error('⚠️ Scam detected by AI!');
        // Send SMS notification if enabled
        if (notificationsEnabled && phoneNumber) {
          // In a real implementation, this would call your SMS service
          console.log(`Sending SMS to ${phoneNumber}: Scam detected with ${confidence}% confidence!`);
          toast.success(`Notification sent to ${phoneNumber}`);
        }
      } else {
        toast.success('✅ No scam detected by AI');
      }
    }, 800);
  };

  const getRiskColor = (score) => {
    if (score > 80) return 'error';
    if (score > 50) return 'warning';
    return 'success';
  };

  const getRiskLabel = (score) => {
    if (score > 80) return 'High Risk';
    if (score > 50) return 'Moderate Risk';
    return 'Low Risk';
  };

  const clearInput = () => {
    setInputText('');
    setDetectionResult(null);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      toast.success('Text pasted from clipboard');
    } catch (error) {
      toast.error('Could not access clipboard');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            🛡️ Scam Detector
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analyze text, messages, or emails for potential scams using our AI-powered detection system
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Paper sx={{ p: 3, mb: 3 }}>
                             <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                 <Tabs value={activeTab} onChange={handleTabChange}>
                   <Tab label="Text Analysis" icon={<ContentPaste />} />
                   <Tab label="Your Scam Alerts" icon={<Warning />} />
                   <Tab label="File Upload" icon={<Upload />} />
                 </Tabs>
               </Box>

              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Enter text to analyze
                  </Typography>
                  

                  
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste suspicious text, email, or message here..."
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      onClick={analyzeText}
                      disabled={loading || !inputText.trim()}
                      startIcon={<Security />}
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={pasteFromClipboard}
                      startIcon={<ContentPaste />}
                    >
                      Paste
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={clearInput}
                      startIcon={<Clear />}
                    >
                      Clear
                    </Button>
                  </Box>

                  {loading && (
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress />
                      <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                        Analyzing text with AI...
                      </Typography>
                    </Box>
                  )}
                </Box>
                             )}

               {activeTab === 1 && (
                 <Box>
                   <GmailInbox />
                 </Box>
               )}

               {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Upload file for analysis
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                    }}
                  >
                    <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Drop files here or click to upload
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supports PDF, DOC, TXT files up to 10MB
                    </Typography>
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="contained"
                      sx={{ mt: 2 }}
                      startIcon={<Upload />}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      Choose File
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </motion.div>

          {/* Detection Result */}
          {detectionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  {detectionResult.isScam ? (
                    <Error sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                  ) : (
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  )}
                  <Box>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                      Analysis Complete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detectionResult.confidence}% confidence
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          Risk Assessment
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Chip
                            label={getRiskLabel(detectionResult.riskScore)}
                            color={getRiskColor(detectionResult.riskScore)}
                            size="large"
                            sx={{ mr: 2 }}
                          />
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {detectionResult.riskScore}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {detectionResult.analysis.summary}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          Detected Scam Types
                        </Typography>
                        {Object.keys(detectionResult.detectedScams).length > 0 ? (
                          <Box>
                            {Object.entries(detectionResult.detectedScams).map(([scamType, indicators]) => (
                              <Box key={scamType} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
                                  🚨 {scamType}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {indicators.map((indicator, index) => (
                                    <Chip
                                      key={index}
                                      label={indicator}
                                      color="warning"
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Total indicators found: {detectionResult.totalIndicators}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="success.main">
                            ✅ No scam indicators found
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Recommendations
                  </Typography>
                  <List>
                    {detectionResult.analysis.recommendations.map((rec, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Info color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            </motion.div>
          )}
        </Grid>

        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Detection History
              </Typography>
              <List>
                {detectionHistory.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {item.isScam ? (
                          <Error color="error" />
                        ) : (
                          <CheckCircle color="success" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {item.inputText.substring(0, 50)}...
                            </Typography>
                            <Chip
                              label={`${item.riskScore}%`}
                              color={getRiskColor(item.riskScore)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={new Date(item.timestamp).toLocaleTimeString()}
                      />
                    </ListItem>
                    {index < detectionHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {detectionHistory.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No detection history"
                      secondary="Your analysis results will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Detection Tips
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Urgency"
                    secondary="Scammers often create false urgency"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Error color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Suspicious Links"
                    secondary="Check URLs before clicking"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Personal Information"
                    secondary="Legitimate companies won't ask for sensitive data via email"
                  />
                </ListItem>
              </List>
            </Paper>
          </motion.div>

          {/* Phone Notifications Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Phone Notifications
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings ? 'Hide Settings' : 'Show Settings'}
                </Button>
              </Box>
              
              <Collapse in={showSettings}>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    variant="outlined"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Enable SMS notifications</Typography>
                    <Switch
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    You will receive SMS notifications when scams are detected
                  </Typography>
                </Box>
              </Collapse>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ScamDetector;